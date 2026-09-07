import { NextResponse } from "next/server";
import { z } from "zod";
import { getSiteSettings } from "@/lib/content";
import {
  cafeRecipient,
  canSendEmail,
  leadRecipient,
  sendEmail,
  withRetry,
} from "@/lib/email";
import { createEnquiry, flagDeliveryFailure } from "@/lib/enquiries";
import { MIN_TIME_ON_FORM_MS, enquiryTypeLabel, type EnquiryResponse } from "@/lib/enquiry";
import { enquirySchema, type EnquiryInput } from "@/lib/enquiry-schema";
import { whatsappUrl } from "@/lib/format";
import { trackLead } from "@/lib/meta/capi";
import { absoluteUrl } from "@/lib/public-env";
import { check, clientKey } from "@/lib/rate-limit";
import { appendRow, isSheetsConfigured, leadRow } from "@/lib/sheets";
import { alertLeadFailure } from "@/lib/lead-alert";
import { verifyTurnstile } from "@/lib/turnstile";

export const runtime = "nodejs";
/** The handler reads the request body, so it can never be prerendered. */
export const dynamic = "force-dynamic";

/**
 * Sixty a minute per address.
 *
 * The per-IP limit is the bluntest of the four defences here and the only one that can hurt a real
 * customer: Indian mobile carriers put very large numbers of subscribers behind one CGNAT address,
 * so a number tight enough to be interesting to an attacker also turns away a student on Jio at
 * 8pm. It exists to stop one connection pinning an instance, and nothing else. The honeypot, the
 * two-second floor and Turnstile are what actually stop a bot, and none of them cares how many
 * other people share the address.
 */
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;

/**
 * The enquiry endpoint.
 *
 * **The order matters.** Sanity is written first, and the response to the student depends only on
 * that write. Everything after it — the academy's email, the auto-reply, the spreadsheet, the Meta
 * event — runs in parallel with retries, and every one of them can fail without the student ever
 * knowing, because the lead is already recorded somewhere the academy looks. Build 1 sent an email
 * and nothing else, which meant a Resend outage was a lost customer.
 *
 * It never throws at the reader. Every path returns JSON with a WhatsApp link, and the two silent
 * drops (honeypot, too fast) are indistinguishable from a success so a bot learns nothing.
 */
export async function POST(request: Request): Promise<NextResponse<EnquiryResponse>> {
  const settings = await getSiteSettings();
  const whatsapp = { number: settings.whatsappNumber, template: settings.whatsappText };
  const fallbackUrl = whatsappUrl(whatsapp);

  const rate = check(clientKey(request, "enquiry"), RATE_LIMIT, RATE_WINDOW_MS);
  if (!rate.ok) {
    log("rate-limited", {});
    return NextResponse.json(
      { ok: false, errors: { form: "Too many attempts. Wait a moment and try again." }, whatsappUrl: fallbackUrl },
      { status: 429, headers: { "retry-after": String(rate.retryAfterSeconds) } },
    );
  }

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

  // Both answered with a 200 so a bot learns nothing from the response, and a real person who
  // somehow trips one still gets the WhatsApp route.
  if (enquiry.company) {
    log("dropped", { reason: "honeypot" });
    return NextResponse.json(whatsappHandoff(fallbackUrl), { status: 200 });
  }
  if (enquiry.elapsedMs < MIN_TIME_ON_FORM_MS) {
    log("dropped", { reason: "too-fast", elapsedMs: enquiry.elapsedMs });
    return NextResponse.json(whatsappHandoff(fallbackUrl), { status: 200 });
  }

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const turnstile = await verifyTurnstile(enquiry.turnstileToken, forwarded);
  if (turnstile.outcome === "failed") {
    log("dropped", { reason: "turnstile", codes: turnstile.errorCodes });
    await alertLeadFailure({
      stage: "turnstile",
      reason: turnstile.errorCodes?.join(",") || "failed",
      context: leadFields(enquiry),
    });
    return NextResponse.json(whatsappHandoff(fallbackUrl), { status: 200 });
  }

  const courseUrl = whatsappUrl({
    ...whatsapp,
    course: enquiry.course || null,
    batch: enquiry.batch || null,
  });

  const source = {
    utm_source: enquiry.utm?.utm_source,
    utm_medium: enquiry.utm?.utm_medium,
    utm_campaign: enquiry.utm?.utm_campaign,
    gclid: enquiry.utm?.gclid,
    fbclid: enquiry.utm?.fbclid,
    referrer: enquiry.referrer,
    landingPage: enquiry.page,
  };

  // The write everything else hangs off.
  const stored = await createEnquiry({
    type: enquiry.type,
    name: enquiry.name,
    phone: `+91${enquiry.phone}`,
    email: enquiry.email || null,
    courseSlug: enquiry.course || null,
    instanceId: enquiry.instanceId || null,
    message: enquiry.message || null,
    source,
  });

  if (!stored.created) {
    /*
     * Sanity is unreachable or has no write token. The lead is still worth having, so it goes to
     * the structured log (which Vercel retains) and the reader is handed to WhatsApp, where the
     * conversation can happen without any of this. The email fan-out is skipped: without the
     * record there is nothing to reconcile an email against.
     */
    log("store-failed", { reason: stored.reason, error: stored.error, ...leadFields(enquiry) });
    await alertLeadFailure({
      stage: "store",
      reason: stored.reason,
      detail: stored.error,
      context: leadFields(enquiry),
    });
    return NextResponse.json(whatsappHandoff(courseUrl), { status: 200 });
  }

  log("stored", { id: stored.id, ...leadFields(enquiry) });

  /*
   * Fan-out. `allSettled`, so one failure cannot take the others down, and nothing here is awaited
   * for its result: the response is already decided.
   */
  const results = await Promise.allSettled([
    notifyAcademy({ enquiry, enquiryId: stored.id, courseUrl }),
    autoReplyToStudent({ enquiry, courseUrl, replyPromise: settings.replyPromise }),
    mirrorToSheet({ enquiry, enquiryId: stored.id }),
    sendLeadEvent({ enquiry, enquiryId: stored.id, forwarded }),
  ]);

  const failed = results
    .map((result, index) => (result.status === "rejected" ? FANOUT_NAMES[index] : null))
    .filter(Boolean);
  if (failed.length > 0) {
    log("fanout-partial", { id: stored.id, failed });
    /*
     * The academy's own notification is the one that matters here: the lead is safe in Sanity, but
     * if that email did not send then nobody has been told it arrived. The auto-reply, the sheet
     * and the Meta event are all recoverable from the record.
     */
    if (failed.includes("academy-email")) {
      await alertLeadFailure({
        stage: "notify",
        reason: failed.join(","),
        context: { enquiryId: stored.id, ...leadFields(enquiry) },
      });
      await flagDeliveryFailure(stored.id, failed.filter(Boolean) as string[]);
    }
  }

  return NextResponse.json({ ok: true, delivery: "email", whatsappUrl: courseUrl }, { status: 200 });
}

const FANOUT_NAMES = ["academy-email", "auto-reply", "sheet", "meta-lead"] as const;

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405, headers: { allow: "POST" } });
}

/* ---------------------------------------------------------------------------------------------
 * The fan-out. Each one is independent and each one is allowed to fail.
 * ------------------------------------------------------------------------------------------- */

async function notifyAcademy({
  enquiry,
  enquiryId,
  courseUrl,
}: {
  enquiry: EnquiryInput;
  enquiryId: string;
  courseUrl: string;
}): Promise<void> {
  // A cafe enquiry is a different conversation with a different person, so it can go to a
  // different inbox. Without CAFE_TO_EMAIL it falls back to the lead address rather than vanishing.
  const to = enquiry.type === "cafe" ? cafeRecipient() : leadRecipient();
  if (!canSendEmail() || !to) {
    log("skipped", { step: "academy-email", reason: !to ? "no-recipient" : "no-key" });
    return;
  }

  const outcome = await withRetry("academy-email", async () => {
    const result = await sendEmail({
      to,
      subject: `${enquiryTypeLabel[enquiry.type]}: ${enquiry.name} (+91 ${enquiry.phone})`,
      text: academyBody(enquiry, enquiryId, courseUrl),
      // So a reply from the academy goes to the student, not to the sending domain.
      replyTo: enquiry.email || undefined,
    });
    if (!result.sent && result.reason === "provider-error") throw new Error(result.error ?? "send failed");
    return result;
  });

  log(outcome.ok ? "sent" : "send-failed", { step: "academy-email", id: enquiryId });
}

async function autoReplyToStudent({
  enquiry,
  courseUrl,
  replyPromise,
}: {
  enquiry: EnquiryInput;
  courseUrl: string;
  replyPromise: string | null;
}): Promise<void> {
  if (!canSendEmail() || !enquiry.email) {
    log("skipped", { step: "auto-reply", reason: enquiry.email ? "no-key" : "no-email" });
    return;
  }

  const outcome = await withRetry("auto-reply", async () => {
    const result = await sendEmail({
      to: enquiry.email as string,
      subject: "We have your enquiry, Espresso Academy India",
      text: studentBody(enquiry, courseUrl, replyPromise),
    });
    if (!result.sent && result.reason === "provider-error") throw new Error(result.error ?? "send failed");
    return result;
  });

  log(outcome.ok ? "sent" : "send-failed", { step: "auto-reply" });
}

async function mirrorToSheet({
  enquiry,
  enquiryId,
}: {
  enquiry: EnquiryInput;
  enquiryId: string;
}): Promise<void> {
  if (!isSheetsConfigured()) {
    log("skipped", { step: "sheet", reason: "not-configured", id: enquiryId });
    return;
  }

  const outcome = await withRetry("sheet", async () => {
    const result = await appendRow(
      leadRow({
        createdAt: new Date().toISOString(),
        type: enquiry.type,
        name: enquiry.name,
        phone: `+91${enquiry.phone}`,
        email: enquiry.email || null,
        course: enquiry.course || null,
        batch: enquiry.batch || null,
        message: enquiry.message || null,
        page: enquiry.page ?? null,
        referrer: enquiry.referrer || null,
        utmSource: enquiry.utm?.utm_source ?? null,
        utmMedium: enquiry.utm?.utm_medium ?? null,
        utmCampaign: enquiry.utm?.utm_campaign ?? null,
        sanityId: enquiryId,
      }),
    );
    if (!result.appended && result.reason === "request-failed") {
      throw new Error(result.error ?? "append failed");
    }
    return result;
  });

  log(outcome.ok ? "mirrored" : "mirror-failed", { step: "sheet", id: enquiryId });
}

async function sendLeadEvent({
  enquiry,
  enquiryId,
  forwarded,
}: {
  enquiry: EnquiryInput;
  enquiryId: string;
  forwarded: string | undefined;
}): Promise<void> {
  const result = await trackLead({
    // Shared with the browser's `generate_lead` push so Meta counts the pair once.
    eventId: `lead-${enquiryId}`,
    email: enquiry.email || null,
    phone: `+91${enquiry.phone}`,
    contentName: enquiry.course || undefined,
    contentId: enquiry.course || undefined,
    sourceUrl: enquiry.page ? absoluteUrl(enquiry.page) : undefined,
    clientIpAddress: forwarded,
  });

  /* Logged distinctly. "not-configured" and "sent" are very different answers to "why is this lead
     not in Meta", and a single cheerful line for both is how a misconfiguration survives a month. */
  log(result.sent ? "sent" : "skipped", {
    step: "meta-lead",
    id: enquiryId,
    ...(result.sent ? {} : { reason: result.reason }),
  });
}

/* ---------------------------------------------------------------------------------------------
 * Bodies
 * ------------------------------------------------------------------------------------------- */

function whatsappHandoff(url: string): EnquiryResponse {
  return { ok: true, delivery: "whatsapp", fallback: "whatsapp", url, whatsappUrl: url };
}

function academyBody(enquiry: EnquiryInput, enquiryId: string, courseUrl: string): string {
  const lines = [
    `Type: ${enquiryTypeLabel[enquiry.type]}`,
    `Name: ${enquiry.name}`,
    `Phone: +91 ${enquiry.phone}`,
    `Email: ${enquiry.email || "not given"}`,
    `Course: ${enquiry.course || "not chosen"}`,
    `Batch: ${enquiry.batch || "not chosen"}`,
    "",
    "Message:",
    enquiry.message || "(none)",
    "",
    "---",
    `Reply on WhatsApp: ${courseUrl}`,
    `In the Studio: /studio/structure/enquiry;${enquiryId}`,
    "",
    `Page: ${enquiry.page ?? "unknown"}`,
    `Referrer: ${enquiry.referrer || "direct"}`,
    `Time on form: ${Math.round(enquiry.elapsedMs / 1000)}s`,
    "Consent given: yes",
  ];
  const utm = enquiry.utm ?? {};
  const utmKeys = Object.keys(utm);
  if (utmKeys.length > 0) {
    lines.push("", "Campaign:");
    for (const key of utmKeys.sort()) lines.push(`  ${key}: ${utm[key]}`);
  }
  return lines.join("\n");
}

/**
 * The auto-reply.
 *
 * It promises nothing the academy has not confirmed: no reply time unless `replyPromise` is set, no
 * fee, no date. Saying "we reply within an hour" on the academy's behalf would be inventing a
 * service level, which content/facts.md forbids as firmly as it forbids inventing a price.
 */
function studentBody(enquiry: EnquiryInput, courseUrl: string, replyPromise: string | null): string {
  const subject = enquiry.course ? `about ${enquiry.course}` : "about the courses";
  return [
    `Hello ${enquiry.name},`,
    "",
    `We have your enquiry ${subject}. The academy reads it and replies to you directly.`,
    "",
    replyPromise ?? "We reply on WhatsApp during academy hours.",
    "",
    `If it is quicker for you, message us here: ${courseUrl}`,
    "",
    enquiry.course
      ? `The course page: ${absoluteUrl(`/courses/${enquiry.course}`)}`
      : `Every course: ${absoluteUrl("/courses")}`,
    "",
    "Espresso Academy India",
    "Official Partner of Espresso Academy, Florence",
  ].join("\n");
}

/** Only what the academy needs. Nothing identifying beyond the type and the course. */
function leadFields(enquiry: EnquiryInput): Record<string, unknown> {
  return {
    type: enquiry.type,
    course: enquiry.course || null,
    batch: enquiry.batch || null,
    hasEmail: Boolean(enquiry.email),
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
