import { expect, test } from "@playwright/test";
import { ADVANCE_RUPEES, BOOKING_TERMS, chargeFor } from "@/lib/booking-terms";
import { todayInIndia } from "@/lib/format";

/**
 * The academy takes an advance, not the fee. Everything here is about the ways that can go wrong
 * with real money: charging more than the course costs, charging a full fee that quietly leaves
 * the tax off, and quoting a balance on a different basis from the payment.
 */
test.describe("chargeFor", () => {
  const off = { fullPaymentEnabled: false };

  test("takes the advance and leaves the rest, gross, once the rate is known", () => {
    /*
     * The IBC Basic at the offer price: ₹26,700 + 18% is ₹31,506, and ₹5,000 of that is paid at
     * the gateway. The balance is ₹26,506, not ₹21,700. Quoting the ex-GST balance beside a gross
     * payment would leave the student ₹4,806 short at the counter, which is the arithmetic this
     * test exists to pin down.
     */
    expect(chargeFor({ feeExGst: 26700, gstRate: 18, ...off })).toEqual({
      amount: 5000,
      balance: 26506,
      payable: 31506,
      gstIncluded: true,
      kind: "advance",
    });
  });

  test("either Advanced course, at ₹30,000 + 18%", () => {
    expect(chargeFor({ feeExGst: 30000, gstRate: 18, ...off })).toEqual({
      amount: 5000,
      balance: 30400,
      payable: 35400,
      gstIncluded: true,
      kind: "advance",
    });
  });

  test("stays ex-GST, and says so, while the rate is unconfirmed", () => {
    expect(chargeFor({ feeExGst: 26700, gstRate: null, ...off })).toEqual({
      amount: 5000,
      balance: 21700,
      payable: 26700,
      gstIncluded: false,
      kind: "advance",
    });
  });

  test("never charges more than the payable", () => {
    /* The ₹1 end-to-end batch. Without the cap the suite would put ₹5,000 through the gateway for
       a course priced at a rupee, and report a balance of minus ₹4,999 to the student. */
    expect(chargeFor({ feeExGst: 1, gstRate: null, ...off })).toEqual({
      amount: 1,
      balance: 0,
      payable: 1,
      gstIncluded: false,
      kind: "advance",
    });
  });

  test("leaves no balance when the payable is exactly the advance", () => {
    expect(chargeFor({ feeExGst: ADVANCE_RUPEES, gstRate: null, ...off })).toEqual({
      amount: 5000,
      balance: 0,
      payable: 5000,
      gstIncluded: false,
      kind: "advance",
    });
  });

  test("charges the whole gross fee when full payment is on and the rate is confirmed", () => {
    expect(chargeFor({ feeExGst: 26700, gstRate: 18, fullPaymentEnabled: true })).toEqual({
      amount: 31506,
      balance: 0,
      payable: 31506,
      gstIncluded: true,
      kind: "full",
    });
  });

  test("refuses full payment while the GST rate is unconfirmed", () => {
    /*
     * The expensive failure. A full payment with no rate charges the ex-GST figure, the student
     * believes the course is paid for, and the academy asks for the tax on day one. The flag being
     * on is not enough; the rate has to exist.
     */
    expect(chargeFor({ feeExGst: 26700, gstRate: null, fullPaymentEnabled: true })).toEqual({
      amount: 5000,
      balance: 21700,
      payable: 26700,
      gstIncluded: false,
      kind: "advance",
    });
  });

  test("the parts always add up to the payable", () => {
    for (const feeExGst of [1, 4999, 5000, 5001, 26700, 30000, 35600]) {
      for (const gstRate of [null, 18]) {
        const charge = chargeFor({ feeExGst, gstRate, ...off });
        expect(
          charge.amount + charge.balance,
          `₹${feeExGst} at ${gstRate ?? "no"}% does not reconcile`,
        ).toBe(charge.payable);
      }
    }
  });
});

test.describe("BOOKING_TERMS", () => {
  test("states the reschedule window, the no-refund rule and that the advance comes off the fee", () => {
    const joined = BOOKING_TERMS.join(" ");
    expect(joined).toContain("3 months");
    expect(joined).toContain("not refunded");
    expect(joined).toContain("₹5,000");
    expect(joined, "an advance charged on top of the fee is a different deal").toContain(
      "comes off the fee",
    );
  });
});

/**
 * A batch has to disappear on its own start date, in Bengaluru's day rather than the server's.
 *
 * On Vercel the server runs in UTC, five and a half hours behind, so a naive implementation drops
 * a batch starting on the 10th at 6.30pm on the 9th local time: the last evening someone might
 * book it.
 */
test.describe("todayInIndia", () => {
  test("is the Indian date, not the UTC one, across the midnight window", () => {
    // 18:30 UTC on the 9th is 00:00 on the 10th in Kolkata.
    expect(todayInIndia(new Date("2026-09-09T18:30:00Z"))).toBe("2026-09-10");
    // A minute earlier it is still the 9th there.
    expect(todayInIndia(new Date("2026-09-09T18:29:00Z"))).toBe("2026-09-09");
  });

  test("sorts as a string against a stored batch date", () => {
    const today = todayInIndia(new Date("2026-09-11T06:00:00Z"));
    expect("2026-09-10" < today, "a batch that started yesterday is behind us").toBe(true);
    expect("2026-09-24" >= today, "a batch later this month is still ahead").toBe(true);
  });
});
