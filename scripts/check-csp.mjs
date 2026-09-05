import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3000";
const paths = ["/", "/courses/latte-art", "/enquire", "/book/instance-e2e-test-batch", "/studio", "/guides/which-course-to-start-with"];

/**
 * Loads every kind of page with consent granted, so GTM, GA4 and the Meta Pixel all actually try
 * to inject, and fails if the browser refused any of it.
 *
 * A CSP that is present but wrong is worse than none: it looks correct in a header assertion and
 * silently breaks a third-party script in production. The header test in tests/e2e/security.spec.ts
 * checks the policy's shape; this checks that the shape does not break the site.
 */
const browser = await chromium.launch();
const context = await browser.newContext();
// Consent accepted, so GTM and the pixel actually try to load and the CSP is exercised.
await context.addCookies([{ name: "ea-consent", value: "accepted", domain: "localhost", path: "/" }]);
const page = await context.newPage();

let violations = 0;
page.on("console", (msg) => {
  const text = msg.text();
  if (/Content Security Policy|Refused to (load|execute|apply|connect)/i.test(text)) {
    violations += 1;
    console.log(`  CSP VIOLATION  ${page.url()}\n    ${text.slice(0, 220)}`);
  }
});
page.on("pageerror", (err) => {
  if (/Content Security Policy/i.test(String(err))) {
    violations += 1;
    console.log(`  PAGE ERROR  ${page.url()}\n    ${String(err).slice(0, 220)}`);
  }
});

for (const path of paths) {
  await page.goto(base + path, { waitUntil: "load" });
  // Scroll, so the analytics loader's interaction gate opens and the scripts actually inject.
  await page.evaluate(() => window.scrollTo(0, 800));
  await page.waitForTimeout(2500);
  console.log(`ok   ${path}`);
}

await browser.close();
console.log(violations === 0 ? "\nNo CSP violation on any route." : `\n${violations} CSP violation(s).`);
process.exit(violations === 0 ? 0 : 1);
