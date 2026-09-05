import "server-only";

/**
 * Everything the server does with a booking.
 *
 * The two rules this file exists to enforce:
 *
 * 11. The amount is read from Sanity with the write token, never from a request body, and never
 *     through the CDN. A fee changed a minute ago must be the fee charged; the CDN is allowed to
 *     be a minute behind and the money is not.
 * 12. Marking a booking paid and incrementing the batch's seat count happen once, inside a
 *     transaction guarded by the batch's revision id, no matter how many times the webhook fires
 *     or whether the browser's verify call got there first.
 */
import { feeForInstance } from "@/lib/batch";
import { writeClient } from "@/lib/sanity/client";
import { bookingByIdQuery, bookingByOrderIdQuery, instanceByIdQuery } from "@/lib/sanity/queries";
import type { Course, CourseInstance } from "@/lib/content";

export type BookingStatus = "created" | "paid" | "failed" | "refunded" | "cancelled";

export interface BookingSource {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  gclid?: string;
  fbclid?: string;
  referrer?: string;
  landingPage?: string;
}

export interface BookableInstance extends CourseInstance {
  course: Course;
}

export interface BookingRecord {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  amount: number | null;
  currency: string | null;
  status: BookingStatus;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  createdAt: string | null;
  paidAt: string | null;
  overbooked: boolean | null;
  course: { slug: string; title: string; levelLabel: string; prerequisites: string | null } | null;
  instance: CourseInstance | null;
}

/**
 * A batch and its course, read fresh with the write token.
 *
 * `useCdn: false` is the whole point of using the write client here rather than the read one.
 */
export async function getInstanceForCheckout(id: string): Promise<BookableInstance | null> {
  if (!writeClient) return null;
  const instance = await writeClient.fetch<BookableInstance | null>(instanceByIdQuery, { id });
  return instance?.course ? instance : null;
}

/** The read path for the confirmation page. Carries personal data; server-side only. */
export async function getBooking(id: string): Promise<BookingRecord | null> {
  if (!writeClient) return null;
  return writeClient.fetch<BookingRecord | null>(bookingByIdQuery, { id });
}

export interface BookingByOrder {
  id: string;
  status: BookingStatus;
  amount: number | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  instanceId: string | null;
  courseTitle: string | null;
  courseSlug: string | null;
  instance: CourseInstance | null;
}

export async function getBookingByOrderId(orderId: string): Promise<BookingByOrder | null> {
  if (!writeClient) return null;
  return writeClient.fetch<BookingByOrder | null>(bookingByOrderIdQuery, { orderId });
}

/**
 * The fee this batch charges, in whole rupees, read from Sanity and nowhere else.
 * Null means the academy has not published a fee, and the site offers an enquiry rather than a
 * checkout.
 */
export function feeInRupees(instance: BookableInstance): number | null {
  return feeForInstance(instance.course, instance);
}

/** Seats left, floored at zero. Null while the academy has not set a seat count. */
export function seatsRemaining(instance: Pick<CourseInstance, "seatsMax" | "seatsBooked">): number | null {
  if (instance.seatsMax === null || instance.seatsMax === undefined) return null;
  return Math.max(0, instance.seatsMax - (instance.seatsBooked ?? 0));
}

export interface CreateBookingInput {
  instanceId: string;
  courseId: string;
  name: string;
  phone: string;
  email: string;
  amountInRupees: number;
  razorpayOrderId: string;
  prerequisiteAccepted: boolean;
  source: BookingSource;
}

/** Creates the `created` booking that an order hangs off. Returns its Sanity document id. */
export async function createBooking(input: CreateBookingInput): Promise<string> {
  if (!writeClient) throw new Error("No Sanity write token: cannot create a booking.");

  const doc = await writeClient.create({
    _type: "booking",
    instance: { _type: "reference", _ref: input.instanceId },
    course: { _type: "reference", _ref: input.courseId },
    name: input.name,
    phone: input.phone,
    email: input.email,
    amount: input.amountInRupees,
    currency: "INR",
    razorpayOrderId: input.razorpayOrderId,
    status: "created" satisfies BookingStatus,
    prerequisiteAccepted: input.prerequisiteAccepted,
    overbooked: false,
    source: { _type: "attributionSource", ...input.source },
    createdAt: new Date().toISOString(),
  });

  return doc._id;
}

export type MarkPaidOutcome =
  /** This call did the work: the booking moved to paid and a seat was taken. */
  | { result: "marked-paid"; bookingId: string; overbooked: boolean }
  /** Someone else got there first. Nothing changed, and that is a success. */
  | { result: "already-paid"; bookingId: string }
  | { result: "not-found" }
  | { result: "no-write-access" };

/**
 * Marks a booking paid and takes a seat, exactly once.
 *
 * The idempotency has two layers, because the two callers race:
 *
 * 1. A read of the booking's current status. If it is already `paid`, return and change nothing.
 *    This catches the ordinary case, the webhook arriving after the browser's verify call.
 * 2. `ifRevisionId` on the batch document inside the transaction. If two payments for the last
 *    seat commit within the same revision window, one of them fails the precondition and retries
 *    against the new revision. This catches the case the status read cannot: two *different*
 *    bookings, not two deliveries of one.
 *
 * If the retries are exhausted, or if the seat would go past `seatsMax`, the booking is still
 * marked paid and flagged `overbooked`. The student has been charged. Refusing to record that,
 * to protect a seat count, would leave money taken and no record of who took it; an overbooking
 * the academy resolves by hand is the smaller failure, and the flag plus the email is how they
 * hear about it.
 */
export async function markBookingPaid({
  bookingId,
  paymentId,
  instanceId,
}: {
  bookingId: string;
  paymentId: string;
  instanceId: string | null;
}): Promise<MarkPaidOutcome> {
  const client = writeClient;
  if (!client) return { result: "no-write-access" };

  const current = await client.fetch<{ status: BookingStatus } | null>(
    `*[_type == "booking" && _id == $id][0]{status}`,
    { id: bookingId },
  );
  if (!current) return { result: "not-found" };
  if (current.status === "paid") return { result: "already-paid", bookingId };

  const paidAt = new Date().toISOString();

  // No batch to count against (a booking whose instance reference was removed). Record the
  // payment anyway: the money is real whether or not the seat count is.
  if (!instanceId) {
    await client
      .patch(bookingId)
      .set({ status: "paid", razorpayPaymentId: paymentId, paidAt })
      .commit();
    return { result: "marked-paid", bookingId, overbooked: false };
  }

  const MAX_ATTEMPTS = 4;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const instance = await client.fetch<{
      _id: string;
      _rev: string;
      seatsMax: number | null;
      seatsBooked: number | null;
    } | null>(`*[_type == "courseInstance" && _id == $id][0]{_id, _rev, seatsMax, seatsBooked}`, {
      id: instanceId,
    });

    if (!instance) {
      await client
        .patch(bookingId)
        .set({ status: "paid", razorpayPaymentId: paymentId, paidAt })
        .commit();
      return { result: "marked-paid", bookingId, overbooked: false };
    }

    const booked = instance.seatsBooked ?? 0;
    const max = instance.seatsMax ?? Number.POSITIVE_INFINITY;
    const wouldOverbook = booked + 1 > max;

    try {
      const transaction = client
        .transaction()
        .patch(
          client
            .patch(instance._id, { ifRevisionID: instance._rev })
            .set({ seatsBooked: wouldOverbook ? booked : booked + 1 }),
        )
        .patch(
          client.patch(bookingId).set({
            status: "paid",
            razorpayPaymentId: paymentId,
            paidAt,
            overbooked: wouldOverbook,
          }),
        );

      /*
       * `sync`, not `async`. An async commit returns before the change is queryable, so the very
       * next /api/orders read could still see the seat as free and sell it twice. The window is a
       * few hundred milliseconds, which is exactly long enough for the second person clicking Book
       * on a nearly-full batch. The webhook is a machine caller with nobody waiting on it, so the
       * extra latency costs nothing that matters.
       */
      await transaction.commit({ visibility: "sync" });
      return { result: "marked-paid", bookingId, overbooked: wouldOverbook };
    } catch (error) {
      const isRevisionConflict =
        typeof error === "object" &&
        error !== null &&
        "statusCode" in error &&
        (error as { statusCode?: number }).statusCode === 409;

      if (!isRevisionConflict || attempt === MAX_ATTEMPTS - 1) {
        // Out of attempts, or a failure that retrying will not fix. The student has paid, so the
        // booking must not be left saying otherwise.
        await client
          .patch(bookingId)
          .set({ status: "paid", razorpayPaymentId: paymentId, paidAt, overbooked: true })
          .commit();
        console.error(
          JSON.stringify({
            at: "bookings/markPaid",
            event: "seat-increment-failed",
            bookingId,
            instanceId,
            attempt,
            error: String(error),
          }),
        );
        return { result: "marked-paid", bookingId, overbooked: true };
      }
      // Someone else changed the batch between the read and the write. Read it again.
    }
  }

  return { result: "marked-paid", bookingId, overbooked: true };
}

/** Records a failed payment. Never touches the seat count: nothing was taken. */
export async function markBookingFailed(bookingId: string, paymentId?: string): Promise<void> {
  if (!writeClient) return;
  const current = await writeClient.fetch<{ status: BookingStatus } | null>(
    `*[_type == "booking" && _id == $id][0]{status}`,
    { id: bookingId },
  );
  // A payment that failed after a successful one (a retry the student abandoned) must not
  // un-book a seat they have already paid for.
  if (!current || current.status === "paid" || current.status === "refunded") return;
  await writeClient
    .patch(bookingId)
    .set({ status: "failed", ...(paymentId ? { razorpayPaymentId: paymentId } : {}) })
    .commit();
}

/**
 * Records a refund and gives the seat back.
 *
 * Only from `paid`: refunding something that was never paid would decrement a seat nobody took.
 */
export async function markBookingRefunded({
  bookingId,
  instanceId,
}: {
  bookingId: string;
  instanceId: string | null;
}): Promise<"refunded" | "already-refunded" | "not-paid"> {
  const client = writeClient;
  if (!client) return "not-paid";

  const current = await client.fetch<{ status: BookingStatus; overbooked: boolean | null } | null>(
    `*[_type == "booking" && _id == $id][0]{status, overbooked}`,
    { id: bookingId },
  );
  if (!current) return "not-paid";
  if (current.status === "refunded") return "already-refunded";
  if (current.status !== "paid") return "not-paid";

  const transaction = client.transaction().patch(
    client.patch(bookingId).set({ status: "refunded" }),
  );

  // An overbooked booking never took a seat, so refunding it must not give one back.
  if (instanceId && !current.overbooked) {
    transaction.patch(client.patch(instanceId).dec({ seatsBooked: 1 }));
  }

  // sync for the same reason as the seat increment: the freed seat has to be immediately sellable.
  await transaction.commit({ visibility: "sync" });
  return "refunded";
}
