/**
 * Phase 9 screenshots: the four pages the client is asked to look at, at 390, taken against the
 * deployed site rather than localhost so what is captured is what they will actually open.
 *
 * Every capture goes through `enableCaptureMode`, and every capture is checked for a visible
 * heading before it is written. A screenshot of this site taken without capture mode has no
 * section headings in it — see scripts/capture-mode.mjs for why — and a silent blank band is not
 * something a reviewer can be expected to notice.
 */
import { chromium } from "@playwright/test";
import { enableCaptureMode, dismissConsent, classifyHeadings } from "./capture-mode.mjs";

const base = process.argv[2] ?? "https://espresso-academy-india.vercel.app";
const shots = [
  ["/", "preview-home"],
  ["/courses", "preview-courses"],
  /* Was /courses/sca-barista-skills-foundation, which revision 2 of content/facts.md removed:
     the client's document describes the SCA as a standards body, not a course on offer. This
     script had been capturing a 404 into docs/screens/preview-course.png. */
  ["/courses/italian-barista-course-basic", "preview-course"],
  ["/enquire", "preview-enquire"],
];

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
await enableCaptureMode(context);
await dismissConsent(context, base);
const page = await context.newPage();

let failures = 0;

for (const [path, name] of shots) {
  const response = await page.goto(base + path, { waitUntil: "networkidle" });
  const status = response?.status() ?? 0;
  if (status >= 400) {
    console.error(`FAIL ${path}  HTTP ${status} — not captured`);
    failures += 1;
    continue;
  }

  const { visible, clipped, screenReader } = await classifyHeadings(page);
  if (clipped.length > 0) {
    console.error(`FAIL ${path}  ${clipped.length} h2 clipped — capture mode is not taking effect.`);
    console.error(`     ${clipped.join(" | ")}`);
    failures += 1;
    continue;
  }

  await page.screenshot({ path: `docs/screens/${name}.png`, fullPage: true });
  console.log(
    `docs/screens/${name}.png  <-  ${base}${path}` +
      `  (${visible.length} visible, ${screenReader.length} sr-only)`,
  );
}

await browser.close();

if (failures > 0) {
  console.error(`\n${failures} capture(s) refused. Nothing partial was written for those routes.`);
  process.exit(1);
}
