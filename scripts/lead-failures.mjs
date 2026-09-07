#!/usr/bin/env node
/**
 * Counts leads whose delivery failed, and writes the count into docs/STATUS.md.
 *
 * Run nightly. A dropped lead answers 200 and hands the visitor to WhatsApp, which is right for
 * them and invisible to everyone else — so without a number somewhere a broken integration can run
 * for a week and look exactly like a quiet week. This is that number.
 *
 * What it can count: enquiries that reached Sanity and whose email did not send. Those carry
 * `deliveryFailed`, set by /api/enquiry after the fact.
 *
 * What it cannot count, and says so: an enquiry that never reached Sanity has no document to flag.
 * Those exist only in the platform log, and the line below tells whoever reads it how to look.
 *
 *   node scripts/lead-failures.mjs           # print
 *   node scripts/lead-failures.mjs --write   # print and update docs/STATUS.md
 */
import { readFileSync, writeFileSync } from "node:fs";

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
  console.error(`[lead-failures] Sanity answered ${response.status}. Not updating STATUS.md.`);
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
if (failed24h > 0) {
  console.log(`\n⚠  ${failed24h} lead(s) reached Sanity and nobody was emailed about them.`);
}

if (!process.argv.includes("--write")) process.exit(0);

const path = "docs/STATUS.md";
const START = "<!-- lead-failures:start -->";
const END = "<!-- lead-failures:end -->";
const file = readFileSync(path, "utf8");
if (!file.includes(START)) {
  console.error(`[lead-failures] No ${START} marker in ${path}; leaving it alone.`);
  process.exit(0);
}
const updated = file.replace(
  new RegExp(`${START}[\\s\\S]*?${END}`),
  `${START}\n${summary}\n${END}`,
);
if (updated !== file) {
  writeFileSync(path, updated);
  console.log(`\n[lead-failures] ${path} updated.`);
}
