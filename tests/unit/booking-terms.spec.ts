import { expect, test } from "@playwright/test";
import { ADVANCE_RUPEES, BOOKING_TERMS, chargeFor } from "@/lib/booking-terms";

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
