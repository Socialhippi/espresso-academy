#!/usr/bin/env node
/**
 * What the academy still has to fill in, read from Sanity.
 *
 * The "Needs client" table in docs/STATUS.md is a snapshot written by a developer; this is the live
 * version. It exists so the list cannot quietly go stale: the day the academy sets a fee, this
 * report stops asking for it, and the day they add a course with no trainer, it starts.
 *
 * Reports, never fails. A nightly job that goes red because the client has not answered a question
 * is a job people learn to ignore.
 */
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || "production";
const token = process.env.SANITY_API_READ_TOKEN?.trim();

if (!projectId) {
  console.log("No NEXT_PUBLIC_SANITY_PROJECT_ID; nothing to report.");
  process.exit(0);
}

const QUERY = `{
  "coursesWithoutFee": *[_type == "course" && !defined(feeInclGst)]{ "slug": slug.current, title },
  "coursesWithoutTrainer": *[_type == "course" && count(trainers) == 0]{ "slug": slug.current },
  "coursesWithFewFaqs": *[_type == "course" && count(faq) < 4]{ "slug": slug.current, "faqs": count(faq) },
  "coursesWithoutDuration": *[_type == "course" && !defined(durationDays) && !defined(durationHours)]{ "slug": slug.current },
  "coursesWithoutImage": *[_type == "course" && !defined(heroImage.asset)]{ "slug": slug.current },
  "batchesWithoutDate": *[_type == "courseInstance" && !defined(startDate)]{ "id": _id },
  "trainersWithoutRole": *[_type == "trainer" && !defined(role)]{ "slug": slug.current },
  "trainersWithoutPhoto": *[_type == "trainer" && !defined(image.asset)]{ "slug": slug.current },
  "storiesAwaitingPermission": *[_type == "story" && permission != true]{ name },
  "settings": *[_type == "siteSettings"][0]{ email, hours, replyPromise, legalName, whatsappConfirmed, "hasRefundPolicy": count(refundPolicy) > 0 },
  "testBatches": *[_type == "courseInstance" && _id in ["instance-e2e-test-batch", "instance-e2e-soldout-batch"]]{ "id": _id }
}`;

const url = `https://${projectId}.api.sanity.io/v2026-09-05/data/query/${dataset}?query=${encodeURIComponent(QUERY)}`;
const response = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
if (!response.ok) {
  console.log(`Sanity returned ${response.status}; skipping the report.`);
  process.exit(0);
}

const { result } = await response.json();
const line = (label, value) => console.log(`  ${String(value).padStart(3)}  ${label}`);

console.log("Still waiting on the academy\n");
line("courses with no fee", result.coursesWithoutFee.length);
line("courses with no duration", result.coursesWithoutDuration.length);
line("courses with no trainer assigned", result.coursesWithoutTrainer.length);
line("courses with fewer than 4 questions (blocks publishing)", result.coursesWithFewFaqs.length);
line("courses with no photograph", result.coursesWithoutImage.length);
line("batches with no date", result.batchesWithoutDate.length);
line("trainers with no role", result.trainersWithoutRole.length);
line("trainers with no photograph", result.trainersWithoutPhoto.length);
line("stories waiting for written permission", result.storiesAwaitingPermission.length);

const s = result.settings ?? {};
console.log("\nSettings");
for (const [label, value] of [
  ["public email address", s.email],
  ["opening hours", s.hours],
  ["reply promise", s.replyPromise],
  ["legal entity name", s.legalName],
  ["refund policy written", s.hasRefundPolicy ? "yes" : null],
  ["WhatsApp number confirmed", s.whatsappConfirmed ? "yes" : null],
]) {
  console.log(`  ${value ? "set    " : "MISSING"}  ${label}`);
}

if (result.testBatches.length > 0) {
  console.log(
    `\n⚠  ${result.testBatches.length} TEST BATCH(ES) still in the dataset. ` +
      "Delete before launch: pnpm sanity:seed:test-batch -- --delete",
  );
}
