/**
 * Resets the two seeded test batches before every run.
 *
 * The booking suite takes seats and creates bookings, which means the second run would start from
 * a different state than the first: the sold-out batch would already be sold out and the "a signed
 * capture takes a seat" assertion would be comparing against a moved number. A suite whose result
 * depends on how many times it has been run before is a suite nobody trusts.
 *
 * Deletes every booking against the test batches and puts `seatsBooked` back to zero. Touches
 * nothing else: it is keyed on two document ids that only exist because a seed script created
 * them, and a run without a write token skips rather than failing, so the suite still runs on a
 * machine that has no Sanity credentials.
 */
import { createClient } from "@sanity/client";

const TEST_INSTANCES = ["instance-e2e-test-batch", "instance-e2e-soldout-batch"];

export default async function globalSetup(): Promise<void> {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim();
  const token = process.env.SANITY_API_WRITE_TOKEN?.trim();

  if (!projectId || !dataset || !token) {
    console.log("[global-setup] No Sanity write credentials; leaving the test batches alone.");
    return;
  }

  const client = createClient({
    projectId,
    dataset,
    token,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION?.trim() || "2026-09-05",
    useCdn: false,
  });

  const present = await client.fetch<string[]>(
    `*[_type == "courseInstance" && _id in $ids]._id`,
    { ids: TEST_INSTANCES },
  );

  if (present.length === 0) {
    console.log(
      "[global-setup] No test batches in this dataset. Run `pnpm sanity:seed:test-batch` to create them; the booking suite will skip until then.",
    );
    return;
  }

  const deleted = await client.delete({
    query: `*[_type == "booking" && instance._ref in $ids]`,
    params: { ids: present },
  });

  const transaction = client.transaction();
  for (const id of present) transaction.patch(client.patch(id).set({ seatsBooked: 0 }));
  await transaction.commit({ visibility: "sync" });

  console.log(
    `[global-setup] Reset ${present.length} test batch(es) and removed ${deleted.results?.length ?? 0} test booking(s).`,
  );
}
