/**
 * Phase 9 screenshots: the four pages the client is asked to look at, at 390, taken against the
 * deployed site rather than localhost so what is captured is what they will actually open.
 */
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "https://espresso-academy-india.vercel.app";
const shots = [
  ["/", "preview-home"],
  ["/courses", "preview-courses"],
  ["/courses/sca-barista-skills-foundation", "preview-course"],
  ["/enquire", "preview-enquire"],
];

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
// Dismiss the consent banner: the client will see it once, and it would otherwise sit across the
// foot of all four captures.
await context.addCookies([
  { name: "ea-consent", value: "accepted", domain: new URL(base).hostname, path: "/" },
]);
const page = await context.newPage();

for (const [path, name] of shots) {
  await page.goto(base + path, { waitUntil: "networkidle" });
  await page.screenshot({ path: `docs/screens/${name}.png`, fullPage: true });
  console.log(`docs/screens/${name}.png  <-  ${base}${path}`);
}

await browser.close();
