import { NextResponse } from "next/server";
import { z } from "zod";
import { orderSchema } from "@/lib/booking-schema";
import {
  createBooking,
  feeInRupees,
  getInstanceForCheckout,
  hasStarted,
  seatsRemaining,
} from "@/lib/bookings";
import { chargeFor, isFullPaymentEnabled } from "@/lib/booking-terms";
import { MIN_TIME_ON_FORM_MS } from "@/lib/enquiry";
import { getPaymentProvider, rupeesToPaise } from "@/lib/payments/provider";
import { check, clientKey } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Thirty a minute per address, not six.
 *
 * Indian mobile carriers put very large numbers of subscribers behind one CGNAT address, so a
 * per-IP limit tight enough to be interesting to an attacker is also tight enough to turn away
 * real customers on Jio at 8pm. Thirty still stops a script dead and leaves room for a shared
 * connection; the honeypot, the two-second floor and Turnstile are what actually stop the bot.
 */
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

export interface OrderResponse {
  ok: boolean;
  /** Present on success: everything Checkout.js needs to open. */
  order?: {
    bookingId: string;
    orderId: string;
    /** Paise, as the gateway wants it. Displayed by the browser, never sent back to us. */
    amountInPaise: number;
    currency: string;
    keyId: string;
    name: string;
    description: string;
    prefill: { name: string; email: string; contact: string };
  };
  errors?: Record<string, string>;
  /** Set when the batch filled between the page render and the submit. */
  soldOut?: boolean;
}

export async function POST(request: Request): Promise<NextResponse<OrderResponse>> {
  const rate = check(clientKey(request, "orders"), RATE_LIMIT, RATE_WINDOW_MS);
  if (!rate.ok) {
    log("rate-limited", {});
    return NextResponse.json(
      { ok: false, errors: { form: "Too many attempts. Wait a moment and try again." } },
      { status: 429, headers: { "retry-after": String(rate.retryAfterSeconds) } },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, errors: { form: "We could not read that. Try again." } },
      { status: 400 },
    );
  }

  const parsed = orderSchema.safeParse(payload);
  if (!parsed.success) {
    const fieldErrors = z.flattenError(parsed.error).fieldErrors;
    const errors: Record<string, string> = {};
    for (const [field, messages] of Object.entries(fieldErrors)) {
      const first = messages?.[0];
      if (first) errors[field] = first;
    }
    log("rejected", { reason: "validation", fields: Object.keys(errors) });
    return NextResponse.json({ ok: false, errors }, { status: 400 });
  }

  const input = parsed.data;

  /*
   * Honeypot and time floor. Unlike the enquiry form these answer with a 400 rather than a
   * cheerful 200: an enquiry that is silently dropped costs the sender nothing, but a checkout
   * that pretends to succeed and never opens a payment window would strand a real person who
   * somehow tripped the check, with no way to tell what happened.
   */
  if (input.company) {
    log("dropped", { reason: "honeypot" });
    return NextResponse.json(
      { ok: false, errors: { form: "We could not start that booking. Message us on WhatsApp." } },
      { status: 400 },
    );
  }
  if (input.elapsedMs < MIN_TIME_ON_FORM_MS) {
    log("dropped", { reason: "too-fast", elapsedMs: input.elapsedMs });
    return NextResponse.json(
      { ok: false, errors: { form: "That was too quick. Check the details and submit again." } },
      { status: 400 },
    );
  }

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const turnstile = await verifyTurnstile(input.turnstileToken, forwarded);
  if (turnstile.outcome === "failed") {
    log("dropped", { reason: "turnstile", codes: turnstile.errorCodes });
    return NextResponse.json(
      { ok: false, errors: { form: "We could not verify that you are human. Reload and try again." } },
      { status: 400 },
    );
  }

  const provider = await getPaymentProvider();
  if (!provider) {
    log("unavailable", { reason: "no-payment-keys" });
    return NextResponse.json(
      { ok: false, errors: { form: "Online payment is not switched on yet. Message us on WhatsApp." } },
      { status: 503 },
    );
  }

  /*
   * Re-read the batch from Sanity with the write token and no CDN. Everything the request said
   * about price, seats or course is ignored: only the id is taken from the browser.
   */
  const instance = await getInstanceForCheckout(input.instanceId);
  if (!instance) {
    log("rejected", { reason: "unknown-instance", instanceId: input.instanceId });
    return NextResponse.json(
      { ok: false, errors: { form: "That batch is no longer available." } },
      { status: 404 },
    );
  }

  if (instance.status === "completed" || instance.status === "tbc") {
    return NextResponse.json(
      { ok: false, errors: { form: "That batch is not open for booking." } },
      { status: 409 },
    );
  }

  /* A batch leaves the calendar on its start date, so this URL is the only way to reach one that
     has begun, and it is a URL people have: it is in the confirmation email and in the history of
     everyone who looked at the page. Taking money for a course that started this morning is worse
     than turning the request away. */
  if (hasStarted(instance)) {
    log("rejected", { reason: "already-started", instanceId: instance.id });
    return NextResponse.json(
      { ok: false, errors: { form: "That batch has already started. Ask us about the next one." } },
      { status: 409 },
    );
  }

  const seats = seatsRemaining(instance);
  if (seats !== null && seats <= 0) {
    log("rejected", { reason: "sold-out", instanceId: instance.id });
    return NextResponse.json(
      { ok: false, soldOut: true, errors: { form: "The last seat on this batch has gone." } },
      { status: 409 },
    );
  }

  const fee = feeInRupees(instance);
  if (fee === null) {
    return NextResponse.json(
      { ok: false, errors: { form: "The fee for this batch is not confirmed yet. Message us on WhatsApp." } },
      { status: 409 },
    );
  }

  /*
   * What to charge, decided on the server from the fee the server read.
   *
   * The academy's policy is that ₹5,000 confirms a seat and the balance is paid at the campus, so
   * that is what the gateway is asked for. The request body still has no amount field in it and
   * still would not be read if it did.
   */
  const charge = chargeFor({
    feeExGst: fee,
    gstRate: instance.course.gstRate,
    fullPaymentEnabled: isFullPaymentEnabled(),
  });

  // The course states a prerequisite, so the confirmation is required. Checked against the course
  // the server read, not against whatever the browser decided to send.
  if (instance.course.prerequisites && !input.prerequisiteAccepted) {
    return NextResponse.json(
      { ok: false, errors: { prerequisiteAccepted: "Confirm that you meet the prerequisite" } },
      { status: 400 },
    );
  }

  const amountInPaise = rupeesToPaise(charge.amountExGst);

  try {
    const order = await provider.createOrder({
      amountInPaise,
      currency: "INR",
      receipt: `${instance.course.slug}-${Date.now()}`.slice(0, 40),
      notes: {
        instanceId: instance.id,
        courseSlug: instance.course.slug,
        paymentType: charge.kind,
        balanceDueExGst: String(charge.balanceExGst),
        name: input.name,
        phone: input.phone,
        email: input.email,
      },
    });

    const bookingId = await createBooking({
      instanceId: instance.id,
      courseId: instance.course.id,
      name: input.name,
      phone: `+91${input.phone}`,
      email: input.email,
      amountInRupees: charge.amountExGst,
      paymentType: charge.kind,
      courseFeeExGst: fee,
      balanceDueExGst: charge.balanceExGst,
      gstRate: instance.course.gstRate,
      razorpayOrderId: order.orderId,
      prerequisiteAccepted: Boolean(input.prerequisiteAccepted),
      source: {
        utm_source: input.utm?.utm_source,
        utm_medium: input.utm?.utm_medium,
        utm_campaign: input.utm?.utm_campaign,
        gclid: input.utm?.gclid,
        fbclid: input.utm?.fbclid,
        referrer: input.referrer,
        landingPage: input.page,
      },
    });

    log("created", {
      bookingId,
      orderId: order.orderId,
      instanceId: instance.id,
      courseSlug: instance.course.slug,
      amountInPaise,
      paymentType: charge.kind,
      balanceDueExGst: charge.balanceExGst,
      seatsRemaining: seats,
    });

    return NextResponse.json({
      ok: true,
      order: {
        bookingId,
        orderId: order.orderId,
        amountInPaise: order.amountInPaise,
        currency: order.currency,
        keyId: provider.publicKeyId,
        name: instance.course.title,
        /* The gateway window is the last thing a student reads before their bank app opens, so it
           says what this payment is rather than repeating the level. Someone who thinks they are
           paying in full and is asked for a balance in September has been misled by this line. */
        description:
          charge.kind === "advance"
            ? `Seat advance · ${instance.course.levelLabel} · Espresso Academy India`
            : `Full fee · ${instance.course.levelLabel} · Espresso Academy India`,
        prefill: { name: input.name, email: input.email, contact: `+91${input.phone}` },
      },
    });
  } catch (error) {
    log("order-failed", { error: error instanceof Error ? error.message : "unknown" });
    return NextResponse.json(
      { ok: false, errors: { form: "We could not open the payment window. Message us on WhatsApp." } },
      { status: 502 },
    );
  }
}

export function GET(): NextResponse {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405, headers: { allow: "POST" } });
}

function log(event: string, fields: Record<string, unknown>): void {
  console.log(JSON.stringify({ at: "api/orders", event, ...fields }));
}
