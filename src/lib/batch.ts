/**
 * Pure functions about a batch: what it costs, how many seats are left, and whether it can be
 * booked.
 *
 * Deliberately free of `server-only`, and importing nothing. These are the rules the checkout, the
 * course page, the calendar and the workshops page all have to agree on, and a rule that can only
 * be exercised inside a React Server Component is a rule that gets tested by clicking. The unit
 * suite imports this file directly.
 *
 * `src/lib/content.ts` re-exports all of it, so callers keep one import.
 */

export interface BatchSeats {
  seatsMax: number | null;
  seatsBooked?: number | null;
}

export interface BatchPricing {
  priceOverride: number | null;
}

export interface CoursePricing {
  feeInclGst: number | null;
}

export interface BatchState extends BatchSeats, BatchPricing {
  status: "open" | "waitlist" | "soldout" | "completed" | "tbc";
  /** Derived by the query as seatsMax - seatsBooked. Null while seatsMax is unset. */
  seatsAvailable?: number | null;
}

/** Seats left, floored at zero. Null while the academy has not set a seat count. */
export function seatsLeft(instance: BatchState): number | null {
  if (instance.seatsAvailable !== null && instance.seatsAvailable !== undefined) {
    return Math.max(0, instance.seatsAvailable);
  }
  if (instance.seatsMax === null || instance.seatsMax === undefined) return null;
  return Math.max(0, instance.seatsMax - (instance.seatsBooked ?? 0));
}

/**
 * The fee this batch charges, in whole rupees: its override, else the course fee, else null.
 * Null is the ordinary state today, and it is what makes the site offer an enquiry rather than a
 * checkout.
 */
export function feeForInstance(course: CoursePricing, instance: BatchPricing): number | null {
  return instance.priceOverride ?? course.feeInclGst ?? null;
}

/**
 * What a batch row's button should say.
 *
 * One function, because the course page, the calendar and the workshops page all render this row
 * and three copies would be three chances to offer a Book button for a batch with no fee.
 *
 * The order of the checks matters: a batch with no fee is always "enquire", whatever its status
 * says, because there is nothing to charge.
 */
export function batchAction(
  course: CoursePricing,
  instance: BatchState,
): "book" | "waitlist" | "enquire" {
  if (feeForInstance(course, instance) === null) return "enquire";
  if (instance.status === "completed" || instance.status === "tbc") return "enquire";
  if (instance.status === "soldout" || instance.status === "waitlist") return "waitlist";
  const left = seatsLeft(instance);
  if (left !== null && left <= 0) return "waitlist";
  return "book";
}

/**
 * Whole rupees to whole paise. The one place the conversion happens.
 *
 * It throws rather than coercing. A fee of 25300.5, or of "25300", or of 0, is a data problem that
 * should stop an order being created, not one that should quietly charge somebody 2530050 paise.
 */
export function rupeesToPaise(rupees: number): number {
  if (!Number.isInteger(rupees) || rupees <= 0) {
    throw new Error(`Fee must be a positive whole number of rupees, got ${String(rupees)}`);
  }
  return rupees * 100;
}
