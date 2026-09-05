"use client";

// Client: it polls a status that changes after the page was rendered, and fires `purchase` once.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { WhatsAppButtonClient } from "@/components/site/WhatsAppButtonClient";
import { eventId, trackPurchaseOnce } from "@/lib/analytics/events";

interface BookingStatusPollProps {
  bookingId: string;
  /** The status the server rendered. "paid" means there is nothing to poll for. */
  initialStatus: string;
  courseTitle: string;
  courseSlug: string;
  amount: number | null;
}

const POLL_INTERVAL_MS = 2000;
const GIVE_UP_AFTER_MS = 30_000;

/**
 * Bridges the gap between a student returning from the payment window and the webhook landing.
 *
 * The two arrive in whichever order the network decides. When the page renders `created` the
 * money has almost certainly been taken and the record has not caught up yet, so this polls for
 * thirty seconds and then says so plainly rather than leaving a spinner running forever.
 *
 * `purchase` fires from here rather than from the page, and only on `paid`, and only once per
 * booking per session: the confirmation URL is bookmarkable, and every reload would otherwise
 * report another sale.
 */
export function BookingStatusPoll({
  bookingId,
  initialStatus,
  courseTitle,
  courseSlug,
  amount,
}: BookingStatusPollProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [gaveUp, setGaveUp] = useState(false);
  /* 0 until the effect below sets it. Calling Date.now() in the initialiser is a render-time
     impurity: React may render twice, and the second call would silently move the deadline. */
  const startedAt = useRef(0);

  useEffect(() => {
    if (status !== "paid") return;
    trackPurchaseOnce(bookingId, {
      transaction_id: bookingId,
      value: amount ?? undefined,
      currency: "INR",
      course_id: courseSlug,
      event_id: eventId("purchase", bookingId),
      items: [{ item_id: courseSlug, item_name: courseTitle, price: amount ?? undefined, quantity: 1 }],
    });
  }, [status, bookingId, amount, courseSlug, courseTitle]);

  useEffect(() => {
    if (status === "paid" || gaveUp) return;
    if (startedAt.current === 0) startedAt.current = Date.now();

    let cancelled = false;
    const timer = setInterval(() => {
      if (Date.now() - startedAt.current > GIVE_UP_AFTER_MS) {
        setGaveUp(true);
        return;
      }
      void fetch(`/api/bookings/${bookingId}/status`, { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : null))
        .then((body: { ok?: boolean; status?: string } | null) => {
          if (cancelled || !body?.ok || !body.status) return;
          if (body.status !== status) {
            setStatus(body.status);
            // Re-render the server component so the batch details and the calendar link appear
            // with the confirmed booking rather than being reconstructed here.
            if (body.status === "paid") router.refresh();
          }
        })
        .catch(() => undefined);
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [bookingId, status, gaveUp, router]);

  if (status === "paid") return null;

  if (status === "failed" || status === "cancelled") {
    return (
      <div className="border border-white-2 bg-white-3 p-6" role="status">
        <h2 className="type-h3 text-black">That payment did not go through</h2>
        <p className="mt-3 measure type-body text-grey">
          Nothing has been charged. You can try again from the course page, or ask the academy to
          hold the seat while you sort it out.
        </p>
        <div className="mt-6">
          <WhatsAppButtonClient course={courseTitle} event="whatsapp_click_booking_failed">
            Ask the academy
          </WhatsAppButtonClient>
        </div>
      </div>
    );
  }

  if (gaveUp) {
    return (
      <div className="border border-white-2 bg-white-3 p-6" role="status">
        <h2 className="type-h3 text-black">Your payment is being confirmed</h2>
        <p className="mt-3 measure type-body text-grey">
          The bank has not finished telling us yet. This is normal and it usually takes a few
          minutes. You will get a confirmation email as soon as it lands, and nothing is charged
          twice if you close this page.
        </p>
        <div className="mt-6">
          <WhatsAppButtonClient course={courseTitle} event="whatsapp_click_booking_pending">
            Check with the academy
          </WhatsAppButtonClient>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 border border-white-2 bg-white-3 p-6" role="status">
      <Loader2 className="mt-0.5 size-5 shrink-0 animate-spin text-grey" aria-hidden="true" />
      <div>
        <p className="type-body text-black">Confirming your payment</p>
        <p className="mt-1 type-small text-grey" aria-live="polite">
          This takes a few seconds. Do not close the page.
        </p>
      </div>
    </div>
  );
}
