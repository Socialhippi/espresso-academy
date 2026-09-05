/**
 * Creates the one bookable batch the end-to-end tests need, in the production dataset.
 *
 * Run with:  pnpm sanity:seed:test-batch
 *
 * Why in production rather than in a separate dataset: the tests run against a real Razorpay test
 * order, which needs a real fee on a real batch, and a second dataset would mean a second set of
 * tokens, a second webhook and a second thing to keep in step with the schema. The batch is named
 * so nobody could mistake it, priced at ₹1 so a mis-click costs a rupee in test mode, and it is
 * the only document in the dataset that carries a fee.
 *
 * The course it hangs off is real, so the course's own `feeInclGst` stays null and the site keeps
 * its TBC state everywhere else: the fee lives on the batch as a `priceOverride`.
 *
 * Delete it with:  pnpm sanity:seed:test-batch -- --delete
 */
import { getCliClient } from "sanity/cli";

const client = getCliClient({ apiVersion: "2026-09-05" });

const INSTANCE_ID = "instance-e2e-test-batch";
/** One seat, so the sold-out path can be exercised without exhausting the main test batch. */
const SOLDOUT_ID = "instance-e2e-soldout-batch";
const COURSE_ID = "course-latte-art";

/** Far enough out that the schema's "start date must be in the future" rule keeps passing. */
function startDate(): string {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() + 1);
  return date.toISOString().slice(0, 10);
}

async function main(): Promise<void> {
  if (process.argv.includes("--delete")) {
    for (const id of [INSTANCE_ID, SOLDOUT_ID]) {
      await client.delete({
        query: '*[_type == "booking" && instance._ref == $id]',
        params: { id },
      });
      await client.delete(id);
    }
    console.log("Deleted both test batches and every booking against them.");
    return;
  }

  const start = startDate();
  const end = new Date(`${start}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 1);

  const shared = {
    _type: "courseInstance" as const,
    course: { _type: "reference" as const, _ref: COURSE_ID },
    status: "open",
    startDate: start,
    endDate: end.toISOString().slice(0, 10),
    venue: { _type: "reference" as const, _ref: "venue-bengaluru-campus" },
    seatsBooked: 0,
    // ₹1. Real enough for Razorpay's test mode to produce a real order; small enough that a
    // mis-click on a live key would cost a rupee rather than a fee.
    priceOverride: 1,
  };

  await client.createOrReplace({
    ...shared,
    _id: INSTANCE_ID,
    schedule: "TEST BATCH, do not book",
    // Room for a whole suite run without the batch selling out halfway through it.
    seatsMax: 40,
    notes:
      "TEST BATCH, do not book. Created by sanity/seed/test-batch.ts for the end-to-end suite. Delete before launch: pnpm sanity:seed:test-batch -- --delete",
  });

  await client.createOrReplace({
    ...shared,
    _id: SOLDOUT_ID,
    schedule: "TEST BATCH, do not book (sold-out path)",
    seatsMax: 1,
    notes:
      "TEST BATCH, do not book. One seat, so the suite can fill it and assert the sold-out state. Delete before launch.",
  });

  console.log(`Seeded ${INSTANCE_ID}: 40 seats, ₹1, starting ${start}.`);
  console.log(`Seeded ${SOLDOUT_ID}: 1 seat, for the sold-out path.`);
  console.log("Both are labelled TEST BATCH, do not book. Remove them before launch.");
}

main().catch((error: unknown) => {
  console.error("Test batch seed failed:", error);
  process.exit(1);
});
