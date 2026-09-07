/**
 * Resets the two seeded test batches before every run, **in the `ci` dataset and nowhere else**.
 *
 * The booking suite takes seats and creates bookings, which means the second run would start from
 * a different state than the first: the sold-out batch would already be sold out and the "a signed
 * capture takes a seat" assertion would be comparing against a moved number. A suite whose result
 * depends on how many times it has been run before is a suite nobody trusts.
 *
 * It used to do that in `production`, on the argument that a second dataset meant a second set of
 * tokens to keep in step. That was wrong, and it showed: a CI run deleted a real booking out of the
 * academy's live dataset while it was being used as evidence. Tests write, and anything that writes
 * belongs somewhere it can do no harm. Sanity tokens are project-scoped rather than dataset-scoped,
 * so the second dataset costs nothing but its name.
 *
 * The guard below is deliberately a hard failure rather than a skip. Skipping the reset would still
 * let every test that follows write bookings into whichever dataset it was pointed at, which is the
 * damage, not the reset.
 */
import { createClient } from "@sanity/client";

const TEST_INSTANCES = ["instance-e2e-test-batch", "instance-e2e-soldout-batch"];

/** The only dataset this suite is allowed to touch. */
const CI_DATASET = "ci";

export default async function globalSetup(): Promise<void> {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim();
  const token = process.env.SANITY_API_WRITE_TOKEN?.trim();

  if (dataset && dataset !== CI_DATASET) {
    throw new Error(
      `[global-setup] Refusing to run against the "${dataset}" dataset. This suite creates ` +
        `bookings, takes seats and deletes documents, so it runs only against "${CI_DATASET}". ` +
        `Use \`pnpm test:e2e\`, which sets NEXT_PUBLIC_SANITY_DATASET=${CI_DATASET}, or seed the ` +
        `dataset first with \`pnpm sanity:seed:ci\`.`,
    );
  }

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
