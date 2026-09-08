import { expect, test } from "@playwright/test";
import { ADVANCE_RUPEES, BOOKING_TERMS, chargeFor } from "@/lib/booking-terms";
import { todayInIndia } from "@/lib/format";

/**
 * The academy takes an advance, not the fee. Everything here is about the two ways that can go
 * wrong with real money: charging more than the course costs, and charging a full fee that
 * quietly leaves the tax off.
 */
test.describe("chargeFor", () => {
  const off = { fullPaymentEnabled: false };

  test("takes the advance and leaves the rest as the balance", () => {
    expect(chargeFor({ feeExGst: 26700, gstRate: null, ...off })).toEqual({
      amountExGst: 5000,
      balanceExGst: 21700,
      kind: "advance",
    });
  });

  test("never charges more than the fee", () => {
    /* The ₹1 end-to-end batch. Without the cap the suite would put ₹5,000 through the gateway for
       a course priced at a rupee, and report a balance of minus ₹4,999 to the student. */
    expect(chargeFor({ feeExGst: 1, gstRate: null, ...off })).toEqual({
      amountExGst: 1,
      balanceExGst: 0,
      kind: "advance",
    });
  });

  test("leaves no balance when the fee is exactly the advance", () => {
    expect(chargeFor({ feeExGst: ADVANCE_RUPEES, gstRate: null, ...off })).toEqual({
      amountExGst: 5000,
      balanceExGst: 0,
      kind: "advance",
    });
  });

  test("charges the whole fee when full payment is on and the GST rate is confirmed", () => {
    expect(chargeFor({ feeExGst: 26700, gstRate: 18, fullPaymentEnabled: true })).toEqual({
      amountExGst: 26700,
      balanceExGst: 0,
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
      amountExGst: 5000,
      balanceExGst: 21700,
      kind: "advance",
    });
  });
});

test.describe("BOOKING_TERMS", () => {
  test("states the reschedule window and the no-refund rule", () => {
    const joined = BOOKING_TERMS.join(" ");
    expect(joined).toContain("3 months");
    expect(joined).toContain("not refunded");
    expect(joined).toContain("₹5,000");
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
