/**
 * Who gets to send the booking confirmation, when two callers are racing for it.
 *
 * Both the browser's verify call and the `payment.captured` webhook mark a booking paid, and
 * either may arrive first. Until now only the webhook sent the confirmation, and only on the
 * branch where the booking was not already paid — so when the browser won the race, which is what
 * an in-modal card or UPI payment does, nobody was ever told. The student saw a confirmed booking
 * page promising an email that no code path would send.
 *
 * The fix is a claim, not a check. `if (!booking.notifiedAt) send()` is the same race one level
 * down: two callers both read null, both send, the student gets two emails and the academy gets
 * two. `claimNotification` is a compare-and-set against the document revision, so exactly one
 * caller can win, and it uses the same `ifRevisionID` mechanism `markBookingPaid` already uses for
 * the seat count.
 *
 * Free of `server-only`, and parameterised by the narrowest possible client, for the reason
 * src/lib/booking-terms.ts is: a concurrency rule that can only be exercised by making a real
 * payment is a concurrency rule nobody exercises. tests/unit/notification-claim.spec.ts drives
 * both orderings and the dead heat directly.
 */

/** The slice of a Sanity client this needs. Anything with these three methods will do. */
export interface ClaimClient {
  fetch<T>(query: string, params: Record<string, unknown>): Promise<T>;
  patch(
    id: string,
    options?: { ifRevisionID?: string },
  ): {
    set(fields: Record<string, unknown>): { commit(): Promise<unknown> };
    unset(fields: string[]): { commit(): Promise<unknown> };
  };
}

export type ClaimResult =
  /** This caller won and owns the send. Exactly one caller ever gets this per booking. */
  | "claimed"
  /** Someone else is sending, or already has. Send nothing. */
  | "already-notified"
  | "not-found"
  | "no-write-access";

/** Read once, patch against that exact revision, and re-read if it moved under us. */
const MAX_ATTEMPTS = 4;

const CLAIM_QUERY = `*[_type == "booking" && _id == $id][0]{_rev, notifiedAt}`;

/**
 * Claim the right to notify for this booking.
 *
 * Returns `claimed` to exactly one caller. Everyone else gets `already-notified`, including a
 * second delivery of the same webhook event and a verify call that lost the race.
 *
 * A revision conflict means another write landed between the read and the patch — the status
 * change, the seat increment, or the other notifier. The loop re-reads: if `notifiedAt` is set by
 * then, the other side won; if it is not, that write was something else and this caller tries
 * again against the new revision.
 */
export async function claimNotification(
  client: ClaimClient | null,
  bookingId: string,
  now: () => string = () => new Date().toISOString(),
): Promise<ClaimResult> {
  if (!client) return "no-write-access";

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const current = await client.fetch<{ _rev: string; notifiedAt?: string | null } | null>(
      CLAIM_QUERY,
      { id: bookingId },
    );
    if (!current) return "not-found";
    if (current.notifiedAt) return "already-notified";

    try {
      await client
        .patch(bookingId, { ifRevisionID: current._rev })
        .set({ notifiedAt: now() })
        .commit();
      return "claimed";
    } catch (error) {
      if (!isRevisionConflict(error)) throw error;
      /* Someone else wrote. Loop: the re-read decides whether it was the other notifier. */
    }
  }

  /*
   * Four conflicts in a row without `notifiedAt` ever appearing. Something else is writing to this
   * document in a tight loop. Refusing the claim is the safe answer: a missing email is recoverable
   * by hand and a duplicate one is not.
   */
  return "already-notified";
}

/**
 * Give the claim back, so a retry can still deliver.
 *
 * Called when the send failed outright. `notifiedAt` means "a notification actually went out", not
 * "we tried" — if it meant the latter, a Resend outage during the one minute a student paid would
 * permanently mark that booking as notified and nothing would ever tell them.
 *
 * Deliberately not conditional on a revision: the only caller is the one holding the claim, and a
 * failure to release is worse than a lost update here.
 */
export async function releaseNotification(
  client: ClaimClient | null,
  bookingId: string,
): Promise<void> {
  if (!client) return;
  await client.patch(bookingId).unset(["notifiedAt"]).commit();
}

/** Sanity answers a failed `ifRevisionID` precondition with a 409. */
function isRevisionConflict(error: unknown): boolean {
  const status = (error as { statusCode?: number; response?: { statusCode?: number } } | null)
    ?.statusCode;
  const nested = (error as { response?: { statusCode?: number } } | null)?.response?.statusCode;
  return status === 409 || nested === 409 || /revision/i.test(String(error));
}
