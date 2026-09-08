/**
 * What the site charges, and the terms it has to state when it does.
 *
 * The academy's policy, from content/facts.md revision 2: an advance of ₹5,000 confirms the seat,
 * and the balance is paid at the academy. So that is what the checkout takes. Charging the whole
 * fee online would be the site inventing a payment model the academy does not run. The GST rate is
 * confirmed at 18% now, so the full-payment path could be stated honestly; it stays behind
 * BOOKING_FULL_PAYMENT until the academy asks for it, because which of the two it sells is a
 * business decision and not a technical one.
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

/**
 * What the site is charging right now, and what is left to pay.
 *
 * Every figure here is on one basis, and `gstIncluded` says which. With a confirmed rate they are
 * gross: what leaves the student's account, and what they will be asked for at the counter. Money
 * a person hands over is gross money, and a balance quoted ex-GST would be short by 18% at exactly
 * the moment it matters.
 *
 * The fields lost their `ExGst` suffixes when the rate landed, because keeping them would have
 * meant a field named `balanceExGst` holding a gross figure. Nothing read them yet: there were no
 * bookings in either dataset.
 */
export interface Charge {
  /** What the gateway is asked for, in whole rupees. Never more than the payable. */
  amount: number;
  /** What is left to pay at the academy, in whole rupees. Zero on a full payment. */
  balance: number;
  /** The whole payable on the same basis: `amount` + `balance`. */
  payable: number;
  /** True when these figures include GST. False means "+ GST" applies to each of them. */
  gstIncluded: boolean;
  kind: "advance" | "full";
}

export interface ChargeOptions {
  /** The course fee for this batch, before GST, after any offer. */
  feeExGst: number;
  /** Per cent. Null keeps the figures ex-GST and blocks the full-payment path. */
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
 * the student pays ₹26,700 where ₹31,506 is owed, believes the course is paid for, and is asked
 * for the difference on day one.
 */
export function chargeFor({ feeExGst, gstRate, fullPaymentEnabled }: ChargeOptions): Charge {
  /*
   * The payable is gross once the rate is known. The advance is a gross payment too: ₹5,000 is
   * ₹5,000 at the gateway, not ₹5,000 plus tax, so the balance is the gross total minus it.
   */
  const gstIncluded = gstRate !== null;
  const payable = gstIncluded ? Math.round(feeExGst * (1 + (gstRate as number) / 100)) : feeExGst;

  if (fullPaymentEnabled && gstIncluded) {
    return { amount: payable, balance: 0, payable, gstIncluded, kind: "full" };
  }
  const amount = Math.min(ADVANCE_RUPEES, payable);
  return { amount, balance: payable - amount, payable, gstIncluded, kind: "advance" };
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
  "The ₹5,000 advance confirms your seat, and it comes off the fee rather than being charged on top of it. Seats are capped per batch, so it is the advance that holds one.",
  "The balance is paid to the academy before the first day.",
  "You can move to another batch within 3 months of your original date, with prior notice and if that batch has a seat.",
  "If you do not attend, the fee is not refunded.",
] as const;
