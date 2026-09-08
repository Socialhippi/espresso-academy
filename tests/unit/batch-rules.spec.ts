import { expect, test } from "@playwright/test";
import {
  batchAction,
  courseFeeExGst,
  feeForInstance,
  hasLiveOffer,
  rupeesToPaise,
  seatsLeft,
  type BatchState,
} from "@/lib/batch";

/**
 * The rules that decide whether a seat can be sold, and for how much.
 *
 * Every case below is one the site is actually in or will be in: today every course has a null fee
 * and a `tbc` batch, and the whole site depends on that rendering as "enquire" rather than as a
 * broken Book button.
 */

const FREE_COURSE = { feeExGst: null, offerFeeExGst: null, offerActive: false, gstRate: null };
const PAID_COURSE = { feeExGst: 25300, offerFeeExGst: null, offerActive: false, gstRate: null };

function batch(overrides: Partial<BatchState> = {}): BatchState {
  return {
    status: "open",
    seatsMax: 10,
    seatsBooked: 0,
    seatsAvailable: 10,
    priceOverrideExGst: null,
    ...overrides,
  };
}

test.describe("the fee the server will charge", () => {
  test("is the course fee when the batch does not override it", () => {
    expect(feeForInstance(PAID_COURSE, batch())).toBe(25300);
  });

  test("is the batch override when there is one, even when the course also has a fee", () => {
    expect(feeForInstance(PAID_COURSE, batch({ priceOverrideExGst: 18500 }))).toBe(18500);
  });

  test("is the batch override when the course has no fee at all", () => {
    expect(feeForInstance(FREE_COURSE, batch({ priceOverrideExGst: 1 }))).toBe(1);
  });

  test("is null when neither has one, which is every course today", () => {
    expect(feeForInstance(FREE_COURSE, batch())).toBeNull();
  });
});

test.describe("rupees to paise", () => {
  test("multiplies by a hundred", () => {
    expect(rupeesToPaise(25300)).toBe(2530000);
    expect(rupeesToPaise(1)).toBe(100);
  });

  test("throws on a fraction rather than charging a rounded amount", () => {
    expect(() => rupeesToPaise(25300.5)).toThrow(/whole number/);
  });

  test("throws on zero and on a negative", () => {
    expect(() => rupeesToPaise(0)).toThrow();
    expect(() => rupeesToPaise(-100)).toThrow();
  });
});

test.describe("seats left", () => {
  test("prefers the value the query derived", () => {
    expect(seatsLeft(batch({ seatsAvailable: 3, seatsMax: 10, seatsBooked: 7 }))).toBe(3);
  });

  test("falls back to seatsMax minus seatsBooked", () => {
    expect(seatsLeft(batch({ seatsAvailable: null, seatsMax: 10, seatsBooked: 4 }))).toBe(6);
  });

  test("never goes below zero, even after an overbooking", () => {
    expect(seatsLeft(batch({ seatsAvailable: -1 }))).toBe(0);
    expect(seatsLeft(batch({ seatsAvailable: null, seatsMax: 3, seatsBooked: 5 }))).toBe(0);
  });

  test("is null while the academy has not set a seat count", () => {
    expect(seatsLeft(batch({ seatsAvailable: null, seatsMax: null }))).toBeNull();
  });
});

test.describe("what the button says", () => {
  test("Book when there is a fee, an open status and a seat", () => {
    expect(batchAction(PAID_COURSE, batch())).toBe("book");
  });

  test("Enquire when there is no fee, whatever the status says", () => {
    expect(batchAction(FREE_COURSE, batch({ status: "open" }))).toBe("enquire");
    expect(batchAction(FREE_COURSE, batch({ status: "soldout" }))).toBe("enquire");
  });

  test("Enquire for a batch whose dates are still TBC, which is every batch today", () => {
    expect(batchAction(PAID_COURSE, batch({ status: "tbc" }))).toBe("enquire");
  });

  test("Enquire for a batch that has already run", () => {
    expect(batchAction(PAID_COURSE, batch({ status: "completed" }))).toBe("enquire");
  });

  test("Waitlist when the status says so", () => {
    expect(batchAction(PAID_COURSE, batch({ status: "waitlist" }))).toBe("waitlist");
    expect(batchAction(PAID_COURSE, batch({ status: "soldout" }))).toBe("waitlist");
  });

  test("Waitlist when the seats have run out, even while the status still says open", () => {
    expect(batchAction(PAID_COURSE, batch({ seatsAvailable: 0 }))).toBe("waitlist");
  });

  test("Book when the seat count is unknown but the fee and status are fine", () => {
    // The academy has set a fee and opened the batch but not published a seat count. Turning that
    // into a Waitlist button would refuse a sale the academy is willing to make.
    expect(batchAction(PAID_COURSE, batch({ seatsAvailable: null, seatsMax: null }))).toBe("book");
  });
});

/**
 * The offer is a switch, not a second price kept in step by hand.
 *
 * It ends at the academy's 70th batch, which nothing here can count, so an editor unticks a box
 * and the standard fee has to come back everywhere at once: the card, the course page, the
 * checkout and the amount the gateway is asked for all read this one function.
 */
test.describe("the offer switch", () => {
  const BASIC = {
    feeExGst: 35600,
    offerFeeExGst: 26700,
    offerActive: true,
    gstRate: 18,
  };

  test("charges the offer fee while it is running", () => {
    expect(courseFeeExGst(BASIC)).toBe(26700);
    expect(hasLiveOffer(BASIC)).toBe(true);
  });

  test("charges the standard fee the moment it is switched off", () => {
    const ended = { ...BASIC, offerActive: false };
    expect(courseFeeExGst(ended)).toBe(35600);
    expect(hasLiveOffer(ended), "nothing should be struck through once the offer ends").toBe(false);
  });

  test("a course with no offer is unaffected either way", () => {
    const advanced = { feeExGst: 30000, offerFeeExGst: null, offerActive: true, gstRate: 18 };
    expect(courseFeeExGst(advanced)).toBe(30000);
    expect(hasLiveOffer(advanced)).toBe(false);
  });

  test("a batch override still beats the course, offer or no offer", () => {
    expect(feeForInstance(BASIC, { priceOverrideExGst: 1 })).toBe(1);
    expect(feeForInstance({ ...BASIC, offerActive: false }, { priceOverrideExGst: 1 })).toBe(1);
  });
});
