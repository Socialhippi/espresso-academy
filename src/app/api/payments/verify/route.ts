import { after, NextResponse } from "next/server";
import { verifySchema } from "@/lib/booking-schema";
import { getBookingByOrderId, markBookingPaid } from "@/lib/bookings";
import { notifyBookingOnce } from "@/lib/booking-notify";
import { getPaymentProvider } from "@/lib/payments/provider";
import { check, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * What Checkout.js hands back after a successful payment.
 *
 * This is the fast path, not the source of truth. The browser can close, lose signal or be lying,
 * so the webhook is what the seat count actually trusts; this exists so the student sees a
 * confirmed booking in a second rather than waiting for a webhook round trip. Both call the same
 * idempotent `markBookingPaid`, and whichever arrives first does the work.
 *
 * Both now also send the confirmation, through the same claim. This route used to send nothing at
 * all, which meant that whenever it won the race — which is what an in-modal card or UPI payment
 * does, and what happens always when no live webhook exists yet — the student got a confirmed
 * booking page promising an email that nothing would ever send.
 *
 * The signature is verified before anything is written. An unsigned or wrongly-signed request is
 * a 400 and nothing changes.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const rate = check(clientKey(request, "verify"), 20, 60_000);
  if (!rate.ok) {
    return NextResponse.json(
      { ok: false, reason: "rate-limited" },
      { status: 429, headers: { "retry-after": String(rate.retryAfterSeconds) } },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad-request" }, { status: 400 });
  }

  const parsed = verifySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: "bad-request" }, { status: 400 });
  }

  const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;

  const provider = await getPaymentProvider();
  if (!provider) {
    return NextResponse.json({ ok: false, reason: "not-configured" }, { status: 503 });
  }

  const signatureValid = provider.verifyPayment({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });

  if (!signatureValid) {
    log("bad-signature", { bookingId, orderId: razorpayOrderId });
    return NextResponse.json({ ok: false, reason: "invalid-signature" }, { status: 400 });
  }

  /*
   * The booking is looked up by the order id from the signed payload, not by the booking id from
   * the body. The signature covers the order id; it does not cover the booking id, so trusting
   * that would let a valid signature for one order mark a different booking paid.
   */
  const booking = await getBookingByOrderId(razorpayOrderId);
  if (!booking) {
    log("unknown-order", { orderId: razorpayOrderId });
    return NextResponse.json({ ok: false, reason: "not-found" }, { status: 404 });
  }
  if (booking.id !== bookingId) {
    log("booking-mismatch", { orderId: razorpayOrderId, claimed: bookingId, actual: booking.id });
    return NextResponse.json({ ok: false, reason: "not-found" }, { status: 404 });
  }

  const outcome = await markBookingPaid({
    bookingId: booking.id,
    paymentId: razorpayPaymentId,
    instanceId: booking.instanceId,
  });

  log(outcome.result, { bookingId: booking.id, orderId: razorpayOrderId });

  if (outcome.result === "no-write-access" || outcome.result === "not-found") {
    return NextResponse.json({ ok: false, reason: outcome.result }, { status: 500 });
  }

  /*
   * On `already-paid` too, not only on `marked-paid`. The webhook may have marked it paid and then
   * failed to send — in which case it released the claim — and this is the second chance. The
   * claim makes the call safe to repeat: whoever holds it sends, everyone else returns.
   *
   * `after`, not `await`, and not a floating promise either. The student is waiting on this
   * response: CheckoutForm redirects to the confirmation page from the `.finally()` of this very
   * fetch, so anything awaited here is time they spend watching "Verifying". Sending two emails
   * through `withRetry` plus a Conversions API call is seconds of that. A floating promise would
   * be worse than either — a serverless function may be frozen the moment it responds, so the
   * emails would sometimes simply not happen. `after` gets both: the response goes now, the
   * platform keeps the invocation alive until the work finishes.
   */
  after(async () => {
    const notified = await notifyBookingOnce({
      booking,
      paymentId: razorpayPaymentId,
      overbooked: booking.overbooked,
    }).catch((error: unknown) => {
      log("notify-threw", { bookingId: booking.id, error: String(error) });
      return "send-failed" as const;
    });
    log("notify", { bookingId: booking.id, notified });
  });

  return NextResponse.json({ ok: true, bookingId: booking.id, status: "paid" });
}

export function GET(): NextResponse {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405, headers: { allow: "POST" } });
}

function log(event: string, fields: Record<string, unknown>): void {
  console.log(JSON.stringify({ at: "api/payments/verify", event, ...fields }));
}
