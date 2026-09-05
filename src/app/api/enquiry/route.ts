import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { canSendLeadEmail, env } from "@/lib/env";
import { getSiteSettings } from "@/lib/content";
import { whatsappUrl } from "@/lib/format";
import { MIN_TIME_ON_FORM_MS, enquiryTypeLabel, type EnquiryResponse } from "@/lib/enquiry";
import { enquirySchema, type EnquiryInput } from "@/lib/enquiry-schema";

export const runtime = "nodejs";
/** The handler reads the request body, so it can never be prerendered. */
export const dynamic = "force-dynamic";

/**
 * The enquiry endpoint. It never throws at the reader: every path returns JSON with a WhatsApp
 * link, so a lead is never lost to a 500. Silent drops (bot, too fast) look identical to a success
 * from the outside, which is the point.
 */
export async function POST(request: Request): Promise<NextResponse<EnquiryResponse>> {
  /* The handoff link is the fallback for every failure path, so it is built from the academy's
     real number rather than from nothing: an empty wa.me link opens WhatsApp with no recipient. */
  const settings = await getSiteSettings();
  const whatsapp = { number: settings.whatsappNumber, template: settings.whatsappText };
  const fallbackUrl = whatsappUrl(whatsapp);

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, errors: { form: "We could not read that. Try again." }, whatsappUrl: fallbackUrl },
      { status: 400 },
    );
  }

  const parsed = enquirySchema.safeParse(payload);
  if (!parsed.success) {
    const fieldErrors = z.flattenError(parsed.error).fieldErrors;
    const errors: Record<string, string> = {};
    for (const [field, messages] of Object.entries(fieldErrors)) {
      const first = messages?.[0];
      if (first) errors[field] = first;
    }
    log("rejected", { reason: "validation", fields: Object.keys(errors) });
    return NextResponse.json({ ok: false, errors, whatsappUrl: fallbackUrl }, { status: 400 });
  }

  const enquiry = parsed.data;

  // Honeypot and time-on-form. Both are answered with a 200 so a bot learns nothing from the
  // response, and a real person who somehow trips them still gets the WhatsApp route.
  if (enquiry.company) {
    log("dropped", { reason: "honeypot" });
    return NextResponse.json(whatsappHandoff(fallbackUrl), { status: 200 });
  }
  if (enquiry.elapsedMs < MIN_TIME_ON_FORM_MS) {
    log("dropped", { reason: "too-fast", elapsedMs: enquiry.elapsedMs });
    return NextResponse.json(whatsappHandoff(fallbackUrl), { status: 200 });
  }

  const courseUrl = whatsappUrl({
    ...whatsapp,
    course: enquiry.course || null,
    batch: enquiry.batch || null,
  });

  if (!canSendLeadEmail) {
    // No Resend key or no destination address in this environment. Log the lead so it is still
    // recoverable from the platform logs, and hand the reader to WhatsApp.
    log("received", { delivery: "whatsapp", ...leadFields(enquiry) });
    return NextResponse.json(whatsappHandoff(courseUrl), { status: 200 });
  }

  try {
    const resend = new Resend(env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      // Resend's shared sandbox sender. Swap for a verified academy domain once DNS is set up
      // (tracked in docs/STATUS.md under "needs developer").
      from: "Espresso Academy India <onboarding@resend.dev>",
      to: [env.LEAD_TO_EMAIL as string],
      subject: `${enquiryTypeLabel[enquiry.type]}: ${enquiry.name} (+91 ${enquiry.phone})`,
      text: plainTextBody(enquiry),
    });

    if (error) {
      log("send-failed", { provider: "resend", message: error.message });
      return NextResponse.json(whatsappHandoff(courseUrl), { status: 200 });
    }

    log("received", { delivery: "email", ...leadFields(enquiry) });
    return NextResponse.json({ ok: true, delivery: "email" }, { status: 200 });
  } catch (error) {
    log("send-failed", {
      provider: "resend",
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(whatsappHandoff(courseUrl), { status: 200 });
  }
}

/** Anything that is not a POST. */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405, headers: { allow: "POST" } });
}

function whatsappHandoff(url: string): EnquiryResponse {
  return { ok: true, delivery: "whatsapp", fallback: "whatsapp", url, whatsappUrl: url };
}

function plainTextBody(enquiry: EnquiryInput): string {
  const lines = [
    `Type: ${enquiryTypeLabel[enquiry.type]}`,
    `Name: ${enquiry.name}`,
    `Phone: +91 ${enquiry.phone}`,
    `Course: ${enquiry.course || "not chosen"}`,
    `Batch: ${enquiry.batch || "not chosen"}`,
    "",
    "Message:",
    enquiry.message || "(none)",
    "",
    "---",
    `Page: ${enquiry.page ?? "unknown"}`,
    `Referrer: ${enquiry.referrer || "direct"}`,
    `Time on form: ${Math.round(enquiry.elapsedMs / 1000)}s`,
    `Consent given: yes`,
  ];
  const utm = enquiry.utm ?? {};
  const utmKeys = Object.keys(utm);
  if (utmKeys.length > 0) {
    lines.push("", "Campaign:");
    for (const key of utmKeys.sort()) lines.push(`  ${key}: ${utm[key]}`);
  }
  return lines.join("\n");
}

/** Only what the academy needs. The phone is kept; nothing else identifying is logged. */
function leadFields(enquiry: EnquiryInput): Record<string, unknown> {
  return {
    type: enquiry.type,
    course: enquiry.course || null,
    batch: enquiry.batch || null,
    hasMessage: Boolean(enquiry.message),
    page: enquiry.page ?? null,
    referrer: enquiry.referrer || null,
    utm: enquiry.utm ?? {},
  };
}

/** One structured JSON line per event, so the platform log is greppable. */
function log(event: string, fields: Record<string, unknown>): void {
  console.log(JSON.stringify({ at: "api/enquiry", event, ...fields }));
}
