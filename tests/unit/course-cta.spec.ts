import { expect, test } from "@playwright/test";
import { courseCta, type CtaInstance } from "@/lib/batch";

/**
 * The rule that decides whether a course's primary button takes money or asks a question.
 *
 * Written from the four states a course can be in rather than from the implementation, because the
 * defect this replaces was a hero that offered "Reserve a seat" — an enquiry form — on a course
 * with an open, priced batch sitting in the table below it.
 */

const COURSE = { slug: "latte-art", feeInclGst: null };
const PRICED_COURSE = { slug: "brewing", feeInclGst: 12000 };

function batch(overrides: Partial<CtaInstance> = {}): CtaInstance {
  return {
    id: "instance-one",
    startDate: "2027-09-05",
    status: "open",
    seatsMax: 12,
    seatsBooked: 0,
    seatsAvailable: 12,
    priceOverride: 9000,
    ...overrides,
  };
}

test("one open batch with a fee goes straight to that batch's checkout", () => {
  const cta = courseCta(COURSE, [batch()]);
  expect(cta).toMatchObject({
    kind: "book",
    label: "Book this batch",
    href: "/book/instance-one",
    instanceId: "instance-one",
    batchAlert: false,
  });
});

test("the fee may come from the course rather than the batch", () => {
  const cta = courseCta(PRICED_COURSE, [batch({ priceOverride: null })]);
  expect(cta.kind).toBe("book");
});

test("two open batches scroll to the table instead of choosing for the reader", () => {
  const cta = courseCta(COURSE, [batch(), batch({ id: "instance-two", startDate: "2027-10-05" })]);
  expect(cta).toMatchObject({ kind: "choose", label: "Choose a date", href: "#dates-heading" });
});

test("a dated batch with no fee asks about that batch", () => {
  const cta = courseCta(COURSE, [batch({ priceOverride: null })]);
  expect(cta).toMatchObject({
    kind: "enquire-batch",
    label: "Ask about this batch",
    href: "/enquire?course=latte-art&batch=instance-one",
    batchAlert: false,
  });
});

test("no batch at all asks about the next one, and offers the alert", () => {
  const cta = courseCta(COURSE, []);
  expect(cta).toMatchObject({
    kind: "enquire-next",
    label: "Ask about the next batch",
    href: "/enquire?course=latte-art",
    batchAlert: true,
  });
});

test("a priced open batch with no date is not bookable either", () => {
  // The table only renders dated rows, so "Book this batch" would point at a batch the page never
  // shows, above an empty-state saying dates are being finalised.
  const cta = courseCta(COURSE, [batch({ startDate: null })]);
  expect(cta.kind).toBe("enquire-next");
});

test("a placeholder batch with no date counts as no batch", () => {
  // The seeded `instance-<course>-tbc` rows exist so the calendar has something to say. They are
  // not a batch anyone can be told about.
  const cta = courseCta(COURSE, [batch({ status: "tbc", startDate: null, priceOverride: null })]);
  expect(cta.kind).toBe("enquire-next");
  expect(cta.batchAlert).toBe(true);
});

test("a sold-out priced batch asks rather than offering a checkout", () => {
  const cta = courseCta(COURSE, [batch({ status: "soldout", seatsAvailable: 0 })]);
  expect(cta.kind).toBe("enquire-batch");
});

test("a full batch is not bookable even while its status still says open", () => {
  const cta = courseCta(COURSE, [batch({ seatsAvailable: 0, seatsBooked: 12 })]);
  expect(cta.kind).toBe("enquire-batch");
});

test("a completed batch is not something to ask about", () => {
  const cta = courseCta(COURSE, [batch({ status: "completed", startDate: "2020-01-01" })]);
  expect(cta.kind).toBe("enquire-next");
});

test("the open one wins when a course has both an open and a finished batch", () => {
  const cta = courseCta(COURSE, [
    batch({ id: "old", status: "completed", startDate: "2020-01-01" }),
    batch({ id: "next" }),
  ]);
  expect(cta).toMatchObject({ kind: "book", href: "/book/next" });
});

test("every state names the event the button should report", () => {
  expect(courseCta(COURSE, [batch()]).event).toBe("book_click");
  expect(courseCta(COURSE, []).event).toBe("enquire_click");
});
