import { NextResponse } from "next/server";
import {
  getBookingByOrderId,
  markBookingFailed,
  markBookingPaid,
  markBookingRefunded,
} from "@/lib/bookings";
import { getSiteSettings } from "@/lib/content";
import { bookingRecipient, canSendEmail, sendEmail, withRetry } from "@/lib/email";
import { BOOKING_TERMS } from "@/lib/booking-terms";
import { absoluteUrl } from "@/lib/public-env";
import { formatDateRange, formatFeeAmount } from "@/lib/format";
import { getPaymentProvider } from "@/lib/payments/provider";
import { check, clientKey } from "@/lib/rate-limit";
import { trackPurchase } from "@/lib/meta/capi";

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
        // The verify route, or an earlier delivery of this event, already did the work.
        log("already-paid", { kind, orderId, bookingId: booking.id, paymentId });
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
      await notify({ booking, paymentId, overbooked }).catch((error: unknown) => {
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

/** The confirmation to the student, the notification to the academy, and the server-side Purchase. */
async function notify({
  booking,
  paymentId,
  overbooked,
}: {
  booking: NonNullable<Awaited<ReturnType<typeof getBookingByOrderId>>>;
  paymentId: string;
  overbooked: boolean;
}): Promise<void> {
  const settings = await getSiteSettings();
  const dates = booking.instance
    ? formatDateRange(booking.instance.startDate, booking.instance.endDate)
    : "to be confirmed";
  const venue = booking.instance?.venue;
  const confirmationUrl = absoluteUrl(`/booking/${booking.id}`);

  /*
   * Labelled, because the result of each of these used to be thrown away. `sendEmail` returns
   * `{ sent: false, reason }` rather than throwing — deliberately, so a mail failure cannot undo a
   * payment — and `Promise.allSettled` then discarded it. A student's confirmation rejected by
   * Resend with a 403 looked exactly like one that arrived, in the logs and everywhere else.
   */
  const tasks: Promise<{ label: string; result: unknown }>[] = [];
  const track = (label: string, work: Promise<unknown>) =>
    tasks.push(work.then((result) => ({ label, result })));

  if (canSendEmail() && booking.email) {
    track(
      "booking-confirmation",
      withRetry("booking-confirmation", () =>
        sendEmail({
          to: booking.email as string,
          subject: `Your seat is booked: ${booking.courseTitle ?? "Espresso Academy India"}`,
          text: studentEmail({ booking, dates, venueName: venue?.name ?? null, mapsUrl: venue?.mapsUrl ?? null, confirmationUrl, whatsappNumber: settings.whatsappNumber }),
          replyTo: settings.email ?? undefined,
        }),
      ),
    );
  }

  const academyTo = bookingRecipient();
  if (canSendEmail() && academyTo) {
    track(
      "booking-notification",
      withRetry("booking-notification", () =>
        sendEmail({
          to: academyTo,
          subject: `${overbooked ? "OVERBOOKED " : ""}Booking: ${booking.name ?? "student"}, ${booking.courseTitle ?? "course"} (${dates})`,
          text: academyEmail({ booking, dates, paymentId, overbooked, confirmationUrl }),
          replyTo: booking.email ?? undefined,
        }),
      ),
    );
  }

  track(
    "capi-purchase",
    withRetry("capi-purchase", () =>
      trackPurchase({
        eventId: `purchase-${booking.id}`,
        email: booking.email,
        phone: booking.phone,
        value: booking.amount ?? 0,
        currency: "INR",
        contentName: booking.courseTitle ?? undefined,
        contentId: booking.courseSlug ?? undefined,
        sourceUrl: confirmationUrl,
      }),
    ),
  );

  const settled = await Promise.allSettled(tasks);

  /*
   * Error level for a rejected send. The student paid and got nothing, which is the one failure in
   * this route a person has to know about the same day: the seat is taken, the money is at the
   * gateway, and the only party who does not know it worked is the person who paid.
   */
  for (const outcome of settled) {
    if (outcome.status === "rejected") {
      console.error(
        JSON.stringify({ at: "api/webhooks/razorpay", event: "notify-threw", error: String(outcome.reason) }),
      );
      continue;
    }
    const { label, result } = outcome.value;
    const sendResult = result as { sent?: boolean; reason?: string; error?: string } | undefined;
    if (sendResult && sendResult.sent === false) {
      console.error(
        JSON.stringify({
          at: "api/webhooks/razorpay",
          event: "notify-failed",
          task: label,
          bookingId: booking.id,
          reason: sendResult.reason,
          error: sendResult.error,
        }),
      );
    }
  }
}

function studentEmail({
  booking,
  dates,
  venueName,
  mapsUrl,
  confirmationUrl,
  whatsappNumber,
}: {
  booking: NonNullable<Awaited<ReturnType<typeof getBookingByOrderId>>>;
  dates: string;
  venueName: string | null;
  mapsUrl: string | null;
  confirmationUrl: string;
  whatsappNumber: string;
}): string {
  const owesBalance =
    booking.paymentType === "advance" && (booking.balanceDueExGst ?? 0) > 0;
  return [
    `Hello ${booking.name ?? "there"},`,
    "",
    owesBalance
      ? `Your seat on ${booking.courseTitle ?? "the course"} is confirmed. The ${formatFeeAmount(booking.amount)} advance has been received.`
      : `Your seat on ${booking.courseTitle ?? "the course"} is booked and paid for.`,
    "",
    `Course:  ${booking.courseTitle ?? "TBC"}`,
    `Dates:   ${dates}`,
    `Venue:   ${venueName ?? "Espresso Academy India, Bengaluru campus"}`,
    ...(mapsUrl ? [`Map:     ${mapsUrl}`] : []),
    `Paid:    ${formatFeeAmount(booking.amount)}${owesBalance ? " advance, part of the fee" : ""}`,
    ...(owesBalance
      ? [
          `Balance: ${formatFeeAmount(booking.balanceDueExGst)}${booking.gstRate === null ? " + GST" : " incl. GST"}, paid at the academy before the first day`,
        ]
      : []),
    "",
    ...(owesBalance
      ? [
          /* The one thing this email exists to be unambiguous about. A student who files it and
             arrives believing the course is paid for has been misled by us, not by themselves. */
          "This payment confirms your seat. It is not the full course fee.",
          "",
        ]
      : []),
    "Terms:",
    ...BOOKING_TERMS.map((term) => `- ${term}`),
    "",
    `Your booking page, with the calendar file: ${confirmationUrl}`,
    "",
    // The academy has not sent a kit list, so this says so rather than inventing one.
    "What to bring: the academy will confirm this before the batch starts.",
    "",
    `Questions before then: https://wa.me/${whatsappNumber}`,
    "",
    "See you at the campus.",
    "Espresso Academy India",
  ].join("\n");
}

function academyEmail({
  booking,
  dates,
  paymentId,
  overbooked,
  confirmationUrl,
}: {
  booking: NonNullable<Awaited<ReturnType<typeof getBookingByOrderId>>>;
  dates: string;
  paymentId: string;
  overbooked: boolean;
  confirmationUrl: string;
}): string {
  const lines = [
    overbooked
      ? "*** This payment succeeded after the last seat had gone. The student has been charged and has a booking. Resolve it per the academy's policy. ***"
      : "A seat has been booked and paid for.",
    "",
    `Name:    ${booking.name ?? "?"}`,
    `Phone:   ${booking.phone ?? "?"}`,
    `Email:   ${booking.email ?? "?"}`,
    `Course:  ${booking.courseTitle ?? "?"}`,
    `Dates:   ${dates}`,
    `Paid:    ${formatFeeAmount(booking.amount)}${booking.paymentType === "advance" ? " (advance)" : " (full fee)"}`,
    /* The roster line. The academy needs to know who still owes money before the batch starts,
       and this email is what they file. */
    `Balance: ${
      (booking.balanceDueExGst ?? 0) > 0
        ? `${formatFeeAmount(booking.balanceDueExGst)}${booking.gstRate === null ? " + GST" : " incl. GST"} due at the academy`
        : "nothing outstanding"
    }`,
    "",
    `Razorpay payment: ${paymentId}`,
    `Booking page:     ${confirmationUrl}`,
  ];
  return lines.join("\n");
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
