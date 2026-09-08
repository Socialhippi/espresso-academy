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
  /** Whole rupees, before GST. */
  priceOverrideExGst: number | null;
}

export interface CoursePricing {
  /** Whole rupees, before GST. */
  feeExGst: number | null;
  /** Per cent. Null means no tax-inclusive total may be shown or charged. */
  gstRate: number | null;
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
 * The fee this batch charges before GST, in whole rupees: its override, else the course fee, else
 * null. Null is what makes the site offer an enquiry rather than a checkout, and it is still the
 * state of both Advanced courses.
 */
export function feeForInstance(course: CoursePricing, instance: BatchPricing): number | null {
  return instance.priceOverrideExGst ?? course.feeExGst ?? null;
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

/* ---------------------------------------------------------------------------------------------
 * What the primary call to action should be for a whole course.
 * ------------------------------------------------------------------------------------------- */

export interface CtaInstance extends BatchState {
  id: string;
  startDate: string | null;
}

export interface CourseCta {
  kind: "book" | "choose" | "enquire-batch" | "enquire-next";
  label: string;
  href: string;
  /** Set only when exactly one batch is bookable, so a caller can label or track the batch. */
  instanceId?: string;
  /** True only when there is no dated batch at all, which is when the alert is worth offering. */
  batchAlert: boolean;
  /** `batchAction`'s verdict, for analytics: the event name should say what the button did. */
  event: "book_click" | "enquire_click";
}

/**
 * The rule the hero, the course card and the home batch rows all follow.
 *
 * It exists because they did not. A course with an open, priced batch offered "Reserve a seat" in
 * its hero, which went to the enquiry form: the only route to a checkout was the Book button in the
 * batch table, most of a page further down. Someone ready to pay was sent to ask a question
 * instead, which is the most expensive thing a page can do on a site whose whole job is enrolment.
 *
 * The order of the checks is the order of the reader's certainty. One bookable batch is
 * unambiguous, so it goes straight to the checkout for that batch. Several are ambiguous, so it
 * scrolls to the table where they can be compared rather than guessing on their behalf. A batch
 * with no fee cannot be charged for, so it asks about that batch. No dated batch at all is the
 * only state that should offer the alert.
 */
export function courseCta(
  course: CoursePricing & { slug: string },
  instances: readonly CtaInstance[] = [],
): CourseCta {
  /*
   * `startDate !== null` matters as much as the action does. `BatchTable` only renders dated rows,
   * so a priced, open, undated batch would put "Book this batch" in the hero above a table reading
   * "Batch dates are being finalised" — a demonstrative with nothing to point at, and the alert
   * suppressed. Scoped to this function: `batchAction` still governs /book eligibility, where a
   * date is not what makes a seat payable.
   */
  const bookable = instances.filter(
    (instance) => instance.startDate !== null && batchAction(course, instance) === "book",
  );

  if (bookable.length === 1) {
    const only = bookable[0] as CtaInstance;
    return {
      kind: "book",
      label: "Book this batch",
      href: `/book/${only.id}`,
      instanceId: only.id,
      batchAlert: false,
      event: "book_click",
    };
  }

  if (bookable.length > 1) {
    // Deliberately the section heading rather than a checkout: with two open batches the page
    // cannot know which one, and picking for the reader is worse than showing them both.
    return {
      kind: "choose",
      // Not "Book a batch": a batch is a cohort, not a unit of purchase, and the click chooses
      // rather than books.
      label: "Choose a date",
      href: "#dates-heading",
      batchAlert: false,
      event: "book_click",
    };
  }

  const dated = instances.filter(
    (instance) => instance.startDate !== null && instance.status !== "completed",
  );
  if (dated.length > 0) {
    return {
      kind: "enquire-batch",
      label: "Ask about this batch",
      href: `/enquire?course=${course.slug}&batch=${(dated[0] as CtaInstance).id}`,
      batchAlert: false,
      event: "enquire_click",
    };
  }

  return {
    kind: "enquire-next",
    label: "Ask about the next batch",
    href: `/enquire?course=${course.slug}`,
    batchAlert: true,
    event: "enquire_click",
  };
}
