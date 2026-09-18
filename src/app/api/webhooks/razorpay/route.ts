import { NextResponse } from "next/server";
import {
  getBookingByOrderId,
  markBookingFailed,
  markBookingPaid,
  markBookingRefunded,
} from "@/lib/bookings";
import { notifyBookingOnce } from "@/lib/booking-notify";
import { getPaymentProvider } from "@/lib/payments/provider";
import { check, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Razorpay's webhook. This is what the seat count trusts.
 *
 * CLAUDE.md non-negotiable 12, in two halves:
 *
 * **Signature.** The raw body text is HMAC'd with the webhook secret and compared in constant
 * time, before anything is parsed or read. Re-serialising the JSON first would reorder keys and
 * break the comparison, so the body is read as text and parsed afterwards.
 *
 * **Idempotency.** Razorpay retries a delivery that does not answer 2xx, and the browser's verify
 * call races this one. `markBookingPaid` reads the booking's status first and guards the seat
 * increment with the batch's revision id, so a second delivery of the same event changes nothing
 * and still answers 200. Answering anything else would make Razorpay retry forever.
 */
export async function POST(request: Request): Promise<NextResponse> {
  // Generous: this is a machine caller, and throttling a payment notification is worse than the
  // burst it would prevent. It exists so one bad actor cannot pin an instance.
  const rate = check(clientKey(request, "razorpay-webhook"), 120, 60_000);
  if (!rate.ok) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const provider = await getPaymentProvider();
  if (!provider) {
    log("not-configured", { reason: "no-payment-keys" });
    return NextResponse.json({ ok: false, reason: "not-configured" }, { status: 503 });
  }
  if (!provider.canVerifyWebhooks) {
    log("not-configured", { reason: "no-webhook-secret" });
    return NextResponse.json({ ok: false, reason: "no-webhook-secret" }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  if (!provider.verifyWebhook({ rawBody, signature })) {
    log("bad-signature", { bytes: rawBody.length });
    return NextResponse.json({ ok: false, reason: "invalid-signature" }, { status: 400 });
  }

  let event: RazorpayWebhookBody;
  try {
    event = JSON.parse(rawBody) as RazorpayWebhookBody;
  } catch {
    return NextResponse.json({ ok: false, reason: "bad-json" }, { status: 400 });
  }

  const kind = event.event;
  const payment = event.payload?.payment?.entity;
  const refund = event.payload?.refund?.entity;
  const orderId = payment?.order_id ?? refund?.notes?.order_id ?? null;

  if (!orderId) {
    // Not an event about one of our orders. 200 so Razorpay stops retrying something that can
    // never succeed.
    log("ignored", { kind, reason: "no-order-id" });
    return NextResponse.json({ ok: true, handled: false });
  }

  const booking = await getBookingByOrderId(orderId);
  if (!booking) {
    log("ignored", { kind, orderId, reason: "unknown-order" });
    return NextResponse.json({ ok: true, handled: false });
  }

  switch (kind) {
    case "payment.captured": {
      const paymentId = payment?.id ?? "";
      if (booking.status === "paid") {
        /*
         * The verify route, or an earlier delivery of this event, already marked it paid and took
         * the seat. That used to be the end of it, and it is why a student who paid by card or
         * in-modal UPI never got an email: the browser's verify call almost always wins that race,
         * and this early return sat above the only notify() on the site.
         *
         * The notification is claimed, not counted, so calling it here cannot double-send. A
         * second delivery of this same event reaches this line too and sends nothing.
         */
        const notified = await notifyBookingOnce({
          booking,
          paymentId,
          overbooked: booking.overbooked,
        });
        log("already-paid", { kind, orderId, bookingId: booking.id, paymentId, notified });
        return NextResponse.json({ ok: true, handled: true, idempotent: true });
      }

      const outcome = await markBookingPaid({
        bookingId: booking.id,
        paymentId,
        instanceId: booking.instanceId,
      });

      if (outcome.result === "no-write-access") {
        log("write-failed", { kind, orderId, bookingId: booking.id });
        // 500 so Razorpay retries: this is a transient configuration problem, not a bad event.
        return NextResponse.json({ ok: false, reason: "no-write-access" }, { status: 500 });
      }

      const overbooked = outcome.result === "marked-paid" && outcome.overbooked;
      log("captured", { kind, orderId, bookingId: booking.id, paymentId, overbooked });

      // Everything below is a side effect. None of it may fail the webhook: the payment is real
      // and recorded, and Razorpay retrying because an email bounced would re-run all of it.
      await notifyBookingOnce({ booking, paymentId, overbooked }).catch((error: unknown) => {
        log("notify-failed", { orderId, error: String(error) });
      });

      return NextResponse.json({ ok: true, handled: true, overbooked });
    }

    case "payment.failed": {
      await markBookingFailed(booking.id, payment?.id);
      log("failed", { kind, orderId, bookingId: booking.id });
      return NextResponse.json({ ok: true, handled: true });
    }

    case "refund.processed":
    case "refund.created": {
      const result = await markBookingRefunded({
        bookingId: booking.id,
        instanceId: booking.instanceId,
      });
      log("refunded", { kind, orderId, bookingId: booking.id, result });
      return NextResponse.json({ ok: true, handled: true, result });
    }

    default: {
      log("ignored", { kind, orderId, reason: "unhandled-event" });
      return NextResponse.json({ ok: true, handled: false });
    }
  }
}

export function GET(): NextResponse {
  return NextResponse.json(
    { ok: false, reason: "This endpoint accepts signed POSTs from Razorpay only." },
    { status: 405, headers: { allow: "POST" } },
  );
}

interface RazorpayWebhookBody {
  event?: string;
  payload?: {
    payment?: { entity?: { id?: string; order_id?: string; status?: string } };
    refund?: { entity?: { id?: string; notes?: { order_id?: string } } };
  };
}

function log(event: string, fields: Record<string, unknown>): void {
  console.log(JSON.stringify({ at: "api/webhooks/razorpay", event, ...fields }));
}
