import { NextResponse } from "next/server";
import { writeClient } from "@/lib/sanity/client";
import { bookingStatusQuery } from "@/lib/sanity/queries";
import { check, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The poll target for the confirmation page, for the case where the student returns from the
 * payment window before the webhook has landed.
 *
 * It returns the status and nothing else. The booking id is a Sanity document id, which is not
 * guessable, but "not guessable" is not "authenticated": anyone who has the id would otherwise be
 * able to read a name, a phone number and an email address. The confirmation page renders those
 * on the server, where it is one request from a link the student was given; this endpoint is
 * called repeatedly from the browser, so it says only whether the money has landed.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  // The page polls every two seconds for thirty seconds, so fifteen from one address is the
  // normal case; thirty leaves room for a reload.
  const rate = check(clientKey(request, "booking-status"), 30, 60_000);
  if (!rate.ok) {
    return NextResponse.json(
      { ok: false, reason: "rate-limited" },
      { status: 429, headers: { "retry-after": String(rate.retryAfterSeconds) } },
    );
  }

  const { id } = await params;
  if (!writeClient) {
    return NextResponse.json({ ok: false, reason: "not-configured" }, { status: 503 });
  }

  const booking = await writeClient.fetch<{ id: string; status: string; paidAt: string | null } | null>(
    bookingStatusQuery,
    { id },
  );

  if (!booking) {
    return NextResponse.json({ ok: false, reason: "not-found" }, { status: 404 });
  }

  return NextResponse.json(
    { ok: true, status: booking.status, paidAt: booking.paidAt },
    // Never cached: the whole point is that the answer changes.
    { headers: { "cache-control": "no-store" } },
  );
}
