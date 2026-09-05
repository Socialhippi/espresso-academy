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

/*
 * Every <loc> must be on the host we were asked to check.
 *
 * This is checked rather than assumed because the failure it catches is silent and expensive.
 * NEXT_PUBLIC_SITE_URL unset on Vercel makes the sitemap advertise the per-deployment hostname,
 * which sits behind deployment protection: fetching one returns Vercel's login page with a 200,
 * the crawler harvests that page's links, and the run fails with a screenful of 404s for assets
 * nobody wrote. It reads like a broken site and is a single missing variable. It also means every
 * canonical, OG image and JSON-LD @id points at a URL that changes on the next deploy.
 *
 * Reported once, by origin, and fatal: there is nothing useful to check past this point.
 */
const wrongOrigin = urls.filter((url) => !url.startsWith(`${BASE}/`) && url !== BASE);
if (wrongOrigin.length > 0) {
  const origins = [...new Set(wrongOrigin.map((url) => new URL(url).origin))];
  console.error(
    `\n${wrongOrigin.length} of ${urls.length} sitemap URLs are not on ${BASE}.\n` +
      `  found: ${origins.join(", ")}\n` +
      `  Set NEXT_PUBLIC_SITE_URL to the canonical origin and redeploy.`,
  );
  process.exit(1);
}

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
