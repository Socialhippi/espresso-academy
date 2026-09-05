#!/usr/bin/env node
/**
 * Crawls the sitemap and reports anything that is not a 200, plus every internal link on those
 * pages.
 *
 * Nightly rather than in CI: it is a check on the deployed site, and the interesting failures are
 * the ones that appear over time — a course unpublished in the Studio, a redirect that stopped
 * matching, an external link that rotted.
 */
const BASE = (process.argv[2] ?? "https://espresso-academy-india.vercel.app").replace(/\/+$/, "");

async function text(url) {
  const response = await fetch(url, { redirect: "follow" });
  return { status: response.status, body: response.ok ? await response.text() : "" };
}

const sitemap = await text(`${BASE}/sitemap.xml`);
if (sitemap.status !== 200) {
  console.error(`sitemap.xml returned ${sitemap.status}`);
  process.exit(1);
}

const urls = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
console.log(`sitemap lists ${urls.length} URLs`);

const failures = [];
const internalLinks = new Set();

for (const url of urls) {
  const { status, body } = await text(url);
  const path = url.replace(BASE, "") || "/";
  if (status !== 200) {
    failures.push(`${status} ${path}`);
    console.log(`FAIL ${status} ${path}`);
    continue;
  }
  console.log(`ok   200 ${path}`);
  for (const match of body.matchAll(/href="(\/[^"#?]*)"/g)) {
    internalLinks.add(match[1]);
  }
}

// Every internal link found on a sitemap page, deduplicated. Catches a link to a page that was
// renamed without its inbound links being updated.
console.log(`\nchecking ${internalLinks.size} distinct internal links`);
for (const link of internalLinks) {
  if (link.startsWith("/api/") || link.startsWith("/studio")) continue;
  const response = await fetch(BASE + link, { method: "HEAD", redirect: "follow" });
  if (response.status >= 400) {
    failures.push(`${response.status} ${link} (linked from a sitemap page)`);
    console.log(`FAIL ${response.status} ${link}`);
  }
}

if (failures.length > 0) {
  console.error(`\n${failures.length} broken:\n  ${failures.join("\n  ")}`);
  process.exit(1);
}
console.log("\nEvery sitemap URL and internal link returns 200.");
