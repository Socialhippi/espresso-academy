#!/usr/bin/env node
/**
 * Counts leads whose delivery failed, and reports the number where someone will see it.
 *
 * Run nightly. A dropped lead answers 200 and hands the visitor to WhatsApp, which is right for
 * them and invisible to everyone else — so without a number somewhere a broken integration can run
 * for a week and look exactly like a quiet week. This is that number.
 *
 * It goes to the job summary every night, and to the alert inbox **only when it is above zero**. A
 * nightly "0 leads were lost" email is an email people filter, and then the one that says 4 is
 * filtered with it.
 *
 * What it can count: enquiries that reached Sanity and whose email did not send. Those carry
 * `deliveryFailed`, set by /api/enquiry after the fact.
 *
 * What it cannot count, and says so: an enquiry that never reached Sanity has no document to flag.
 * Those exist only in the platform log, and the line below tells whoever reads it how to look.
 *
 *   node scripts/lead-failures.mjs
 */
import { appendFileSync } from "node:fs";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || "production";
const token = process.env.SANITY_API_READ_TOKEN?.trim();
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION?.trim() || "2026-09-05";

if (!projectId || !token) {
  console.log("[lead-failures] No Sanity credentials; nothing to count.");
  process.exit(0);
}

const query = `{
  "failed24h": count(*[_type == "enquiry" && deliveryFailed == true && _createdAt > $since]),
  "failedEver": count(*[_type == "enquiry" && deliveryFailed == true]),
  "total24h": count(*[_type == "enquiry" && _createdAt > $since]),
  "parts": *[_type == "enquiry" && deliveryFailed == true && _createdAt > $since].deliveryFailedParts[]
}`;

const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
const url =
  `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}` +
  `?query=${encodeURIComponent(query)}&$since=${encodeURIComponent(JSON.stringify(since))}`;

const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
if (!response.ok) {
  console.error(`[lead-failures] Sanity answered ${response.status}. No count tonight.`);
  process.exit(0);
}
const { result } = await response.json();
const { failed24h = 0, failedEver = 0, total24h = 0, parts = [] } = result ?? {};

const stamp = new Date().toISOString().slice(0, 10);
const counted = [...new Set(parts.filter(Boolean))].join(", ") || "none";

const summary = [
  `**Lead delivery, last 24 hours (checked ${stamp}):** ${failed24h} of ${total24h} stored enquiries`,
  `were not emailed to the academy (${failedEver} ever). Parts that failed: ${counted}.`,
  "",
  "A lead that never reached Sanity has no document to flag and is not in this number. Those are in",
  "the platform log only: `vercel logs <deployment> --since 24h --json | grep lead-delivery-failed`.",
].join("\n");

console.log(summary.replace(/\*\*/g, ""));

/* The job summary: a nightly number nobody has to go looking for. */
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    [`## Lead delivery`, "", summary, "", failed24h > 0 ? "**Somebody should look at this.**" : "Nothing lost in the last 24 hours.", ""].join("\n"),
  );
}

if (failed24h === 0) {
  console.log("\nNothing lost in the last 24 hours; no alert sent.");
  process.exit(0);
}

console.log(`\n⚠  ${failed24h} lead(s) reached Sanity and nobody was emailed about them.`);

/*
 * The alert. Sent only on a non-zero count, and only to the address that already receives leads.
 * CI deliberately has no RESEND_API_KEY — a test run must never mail the academy — so this says
 * what it could not do rather than failing: the count is already in the summary above either way.
 */
const resendKey = process.env.RESEND_API_KEY?.trim();
const to = process.env.LEAD_TO_EMAIL?.trim();
if (!resendKey || !to) {
  console.error(
    "[lead-failures] Cannot send the alert: RESEND_API_KEY and LEAD_TO_EMAIL are not set on this " +
      "runner. The count is in the job summary. Add both as repository secrets to have the " +
      "academy emailed when this is not zero.",
  );
  process.exit(0);
}

const sent = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    from: process.env.RESEND_FROM_EMAIL?.trim() || "Espresso Academy India <onboarding@resend.dev>",
    to: [to],
    subject: `[Espresso Academy] ${failed24h} lead(s) were stored and never emailed`,
    text: [
      `${failed24h} of ${total24h} enquiries stored in the last 24 hours were not emailed to the academy.`,
      "They are safe in the Studio; nobody was told they arrived.",
      "",
      `Parts that failed: ${counted}.`,
      "",
      "A lead that never reached Sanity is not in this count and has no record anywhere but the",
      "platform log: vercel logs <deployment> --since 24h --json | grep lead-delivery-failed",
    ].join("\n"),
  }),
});

if (!sent.ok) {
  console.error(`[lead-failures] Resend answered ${sent.status}: ${await sent.text()}`);
  process.exit(0);
}
console.log("[lead-failures] Alert sent.");
