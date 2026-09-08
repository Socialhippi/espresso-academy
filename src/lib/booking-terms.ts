/**
 * What the site charges, and the terms it has to state when it does.
 *
 * The academy's policy, from content/facts.md revision 2: an advance of ₹5,000 confirms the seat,
 * and the balance is paid at the academy. So that is what the checkout takes. Charging the whole
 * fee online would be the site inventing a payment model the academy does not run, and it cannot
 * be done honestly anyway while the GST rate is unconfirmed: the full fee includes tax, and the
 * rate is open question 1 in facts.md.
 *
 * Free of `server-only` and importing nothing, for the same reason src/lib/batch.ts is: the
 * checkout, the course page, the confirmation page and the confirmation email all have to agree
 * about the balance, and a rule that only runs inside a route handler is a rule tested by paying.
 */

/**
 * The advance that confirms a seat, in whole rupees.
 *
 * content/facts.md, "Booking, payment and refund policy": "An advance of ₹5,000 confirms the
 * seat." Not a setting: it is the academy's stated policy, and a policy that can be changed by an
 * environment variable is a policy nobody can quote back to a student.
 */
export const ADVANCE_RUPEES = 5000;

/** What the site is charging for right now, and what is left to pay. All figures ex-GST. */
export interface Charge {
  /** What the gateway is asked for, in whole rupees. Never more than the fee. */
  amountExGst: number;
  /** What is left to pay at the academy, in whole rupees. Zero on a full payment. */
  balanceExGst: number;
  kind: "advance" | "full";
}

export interface ChargeOptions {
  /** The whole course fee for this batch, before GST. */
  feeExGst: number;
  /** Per cent. Null blocks the full-payment path: the full fee includes tax. */
  gstRate: number | null;
  /** The `BOOKING_FULL_PAYMENT` flag. */
  fullPaymentEnabled: boolean;
}

/**
 * What to charge for a seat.
 *
 * The advance is capped at the fee. Without the cap the ₹1 test batch would be charged ₹5,000,
 * and more importantly any batch the academy ever prices below the advance would take more money
 * than it is owed and report a negative balance to the student.
 *
 * Full payment stays reachable but is off by default and refuses to run without a confirmed GST
 * rate. A full payment that silently omits the tax is the one failure here that costs real money:
 * the student pays ₹26,700, believes the course is paid for, and is asked for the tax on day one.
 */
export function chargeFor({ feeExGst, gstRate, fullPaymentEnabled }: ChargeOptions): Charge {
  if (fullPaymentEnabled && gstRate !== null) {
    return { amountExGst: feeExGst, balanceExGst: 0, kind: "full" };
  }
  const amountExGst = Math.min(ADVANCE_RUPEES, feeExGst);
  return { amountExGst, balanceExGst: feeExGst - amountExGst, kind: "advance" };
}

/**
 * True when the academy has switched on paying the whole fee online.
 *
 * Read at call time rather than at module load so a test can set it, and so a redeploy is not
 * needed to read a changed value on a serverless platform that reuses a warm process.
 */
export function isFullPaymentEnabled(): boolean {
  return process.env.BOOKING_FULL_PAYMENT?.trim().toLowerCase() === "true";
}

/**
 * The reschedule and refund terms, verbatim, in the order a student meets them.
 *
 * One array, rendered by the checkout, the confirmation page and the confirmation email, because
 * three copies of a refund policy is three chances for the site to promise something the academy
 * did not agree to. Sourced line by line from content/facts.md.
 */
export const BOOKING_TERMS = [
  "The ₹5,000 advance confirms your seat. Seats are capped per batch, so it is the advance that holds one.",
  "The balance is paid to the academy before the first day.",
  "You can move to another batch within 3 months of your original date, with prior notice and if that batch has a seat.",
  "If you do not attend, the fee is not refunded.",
] as const;
