import "server-only";

/**
 * The booking confirmation, sent exactly once per booking.
 *
 * This used to live inside the `payment.captured` branch of the Razorpay webhook, which meant two
 * things that were both wrong. It was unreachable when the browser's verify call marked the
 * booking paid first — the webhook then took its `already-paid` early return, above the notify —
 * and it was unreachable at all if the live webhook did not exist yet. An in-modal card or UPI
 * payment takes exactly that path, so the student saw a confirmed booking page promising an email
 * that no code path would send, and the academy was never told a seat had gone.
 *
 * It lives here now because both writers need it, and it is wrapped in `notifyBookingOnce`, which
 * claims the right to send before sending. See src/lib/notification-claim.ts for why the claim is
 * a compare-and-set rather than a read and a check.
 */
import { getSiteSettings } from "@/lib/content";
import { bookingRecipient, canSendEmail, sendEmail, withRetry } from "@/lib/email";
import { BOOKING_TERMS } from "@/lib/booking-terms";
import { absoluteUrl } from "@/lib/public-env";
import { formatDateRange, formatFeeAmount } from "@/lib/format";
import { trackPurchase } from "@/lib/meta/capi";
import { writeClient } from "@/lib/sanity/client";
import { claimNotification, releaseNotification } from "@/lib/notification-claim";
import type { BookingByOrder } from "@/lib/bookings";

/** What `notify` managed to do, so the caller can decide whether to keep or release the claim. */
interface NotifyOutcome {
  /** Emails we tried to send. Zero when no recipient is configured. */
  attempted: number;
  /** Emails Resend accepted. */
  delivered: number;
}

/** The confirmation to the student, the notification to the academy, and the server-side Purchase. */
async function notify({
  booking,
  paymentId,
  overbooked,
}: {
  booking: BookingByOrder;
  paymentId: string;
  overbooked: boolean;
}): Promise<NotifyOutcome> {
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
          /* "confirmed", not "booked". A seat held by a ₹5,000 advance is confirmed; the course
             is not paid for, and the subject line is the part a student reads in a list. */
          subject: `Your seat is confirmed: ${booking.courseTitle ?? "Espresso Academy India"}`,
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

  /* Counted per label, because only the two emails decide whether the claim is kept. The CAPI
     Purchase is analytics: losing it must never cause a confirmation email to be sent twice. */
  const emailLabels = new Set(["booking-confirmation", "booking-notification"]);
  let attempted = 0;
  let delivered = 0;

  const settled = await Promise.allSettled(tasks);

  /*
   * Error level for a rejected send. The student paid and got nothing, which is the one failure in
   * this route a person has to know about the same day: the seat is taken, the money is at the
   * gateway, and the only party who does not know it worked is the person who paid.
   */
  for (const outcome of settled) {
    if (outcome.status === "rejected") {
      /* A throw is an attempt that delivered nothing. Which task threw is unknowable from a
         rejected settlement, so it counts as an email attempt: the safe direction is to treat an
         unknown outcome as "not delivered" and let the claim be released. */
      attempted += 1;
      console.error(
        JSON.stringify({ at: "lib/booking-notify", event: "notify-threw", error: String(outcome.reason) }),
      );
      continue;
    }
    const { label, result } = outcome.value;
    const sendResult = result as { sent?: boolean; reason?: string; error?: string } | undefined;
    if (emailLabels.has(label)) {
      attempted += 1;
      if (sendResult?.sent !== false) delivered += 1;
    }
    if (sendResult && sendResult.sent === false) {
      console.error(
        JSON.stringify({
          at: "lib/booking-notify",
          event: "notify-failed",
          task: label,
          bookingId: booking.id,
          reason: sendResult.reason,
          error: sendResult.error,
        }),
      );
    }
  }

  return { attempted, delivered };
}

function studentEmail({
  booking,
  dates,
  venueName,
  mapsUrl,
  confirmationUrl,
  whatsappNumber,
}: {
  booking: BookingByOrder;
  dates: string;
  venueName: string | null;
  mapsUrl: string | null;
  confirmationUrl: string;
  whatsappNumber: string;
}): string {
  const owesBalance =
    booking.paymentType === "advance" && (booking.balanceDue ?? 0) > 0;
  /* The basis this booking was taken on, not today's: a booking taken before the academy confirmed
     the rate keeps its "+ GST" wording in the mailbox it was filed in. */
  const grossSuffix = booking.gstRate === null ? " + GST" : " incl. GST";
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
    /* The three figures reconcile, in the order a student checks them. Before the rate was
       confirmed the fee line could not be stated on the same basis as the payment, so it was left
       out; now they add up and leaving it out would be the omission. */
    ...(booking.payable !== null
      ? [`Fee:     ${formatFeeAmount(booking.payable)}${grossSuffix}`]
      : []),
    `Paid:    ${formatFeeAmount(booking.amount)}${owesBalance ? " advance, part of the fee" : ""}`,
    ...(owesBalance
      ? [
          `Balance: ${formatFeeAmount(booking.balanceDue)}${grossSuffix}`,
          "         Paid on the first day at the academy, by cash, UPI or bank transfer.",
          "         Cards are not accepted for the balance.",
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
  booking: BookingByOrder;
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
      (booking.balanceDue ?? 0) > 0
        ? `${formatFeeAmount(booking.balanceDue)}${booking.gstRate === null ? " + GST" : " incl. GST"} due at the academy`
        : "nothing outstanding"
    }`,
    ...(booking.payable !== null
      ? [`Fee:     ${formatFeeAmount(booking.payable)}${booking.gstRate === null ? " + GST" : " incl. GST"}`]
      : []),
    "",
    `Razorpay payment: ${paymentId}`,
    `Booking page:     ${confirmationUrl}`,
  ];
  return lines.join("\n");
}

/**
 * Send the booking notifications exactly once, whichever caller gets here first.
 *
 * Both the verify route and the webhook call this, on every path where the booking is paid —
 * including the webhook's `already-paid` branch, which is the one that used to drop the email on
 * the floor whenever the browser won the race.
 *
 * The order is claim, send, release-on-total-failure:
 *
 *  - `claimNotification` is a compare-and-set on `notifiedAt`. Exactly one concurrent caller gets
 *    `claimed`; everyone else gets `already-notified` and returns without sending.
 *  - If nothing was delivered, the claim is released so a later retry — the next webhook delivery,
 *    or a redelivery from the Razorpay dashboard — can still get the email out. `notifiedAt` means
 *    "a notification actually went out", not "we tried": if it meant the latter, a Resend outage
 *    lasting one minute would permanently mark every booking taken in that minute as notified.
 *  - A *partial* failure keeps the claim. One of the two emails arriving and the other not is
 *    logged at error level by `notify` and resolved by hand; releasing would resend the one that
 *    already arrived, and a duplicate confirmation is not recoverable the way a missing one is.
 */
export async function notifyBookingOnce({
  booking,
  paymentId,
  overbooked,
  client = writeClient,
}: {
  booking: BookingByOrder;
  paymentId: string;
  overbooked: boolean;
  /** Injectable for the unit suite; production always uses the module's write client. */
  client?: Parameters<typeof claimNotification>[0];
}): Promise<"sent" | "already-notified" | "send-failed" | "no-write-access" | "not-found"> {
  const claim = await claimNotification(client, booking.id);
  if (claim !== "claimed") {
    log("notify-skipped", { bookingId: booking.id, reason: claim });
    return claim === "already-notified" ? "already-notified" : claim;
  }

  let outcome: NotifyOutcome;
  try {
    outcome = await notify({ booking, paymentId, overbooked });
  } catch (error) {
    /* notify() is written not to throw, but a throw here would otherwise leave the claim held and
       the student silently unnotified forever. Release and report. */
    await releaseNotification(client, booking.id).catch(() => undefined);
    log("notify-threw", { bookingId: booking.id, error: String(error) });
    return "send-failed";
  }

  if (outcome.delivered === 0) {
    await releaseNotification(client, booking.id).catch(() => undefined);
    log("notify-released", {
      bookingId: booking.id,
      attempted: outcome.attempted,
      reason: outcome.attempted === 0 ? "no-recipient-configured" : "all-sends-failed",
    });
    return "send-failed";
  }

  log("notified", {
    bookingId: booking.id,
    attempted: outcome.attempted,
    delivered: outcome.delivered,
  });
  return "sent";
}

function log(event: string, fields: Record<string, unknown>): void {
  console.log(JSON.stringify({ at: "lib/booking-notify", event, ...fields }));
}
