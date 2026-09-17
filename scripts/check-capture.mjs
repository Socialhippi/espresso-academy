/**
 * The guard on the capture path: a full-page screenshot must not come back with no headings on it.
 *
 * This exists because the failure it checks for is invisible in the artefact itself. A capture of a
 * page whose section headings have all clipped shut does not look broken — it looks like a page
 * with generous spacing. Every screenshot in docs/screens/ had it, and the design reviews run
 * against those screenshots never mentioned a missing heading, because a missing heading and a
 * quiet section are the same picture.
 *
 * Standalone from the Playwright suite, like check-overflow.mjs, so it can be run against a dev
 * server mid-phase: `node scripts/check-capture.mjs [base-url]`.
 */
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
import { enableCaptureMode, dismissConsent, classifyHeadings } from "./capture-mode.mjs";

const base = process.argv[2] ?? "http://localhost:3000";
const manifest = JSON.parse(readFileSync("tests/routes.json", "utf8"));

/* Indexed routes only. The non-indexed ones are dataset-dependent and 404 against production,
   which check-overflow.mjs already explains at length. */
const paths = manifest.routes.map((route) => route.path);

/* The three widths design.md names, plus the short laptop viewport where the reveal's range is
   tightest: a 620px-tall window gives the wipe the least room to finish in. */
const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1280, height: 620 },
];

const browser = await chromium.launch();
let failures = 0;
let checked = 0;

for (const viewport of VIEWPORTS) {
  const context = await browser.newContext({ viewport });
  await enableCaptureMode(context);
  await dismissConsent(context, base);
  const page = await context.newPage();
  console.log(`\n=== ${viewport.width}x${viewport.height} ===`);

  for (const path of paths) {
    const response = await page.goto(base + path, { waitUntil: "domcontentloaded" });
    if ((response?.status() ?? 0) >= 400) {
      console.log(`  FAIL ${path}  HTTP ${response?.status()}`);
      failures += 1;
      continue;
    }

    /* Take the screenshot the reviewer would take. The point is to assert on the state a
       full-page capture produces, not on some other state the page happens to be in. */
    await page.screenshot({ fullPage: true });
    const { visible, clipped, screenReader } = await classifyHeadings(page);
    checked += 1;

    /* Any clipped heading in capture mode means the escape hatch is not doing its job. This is the
       real regression guard: it fires on the first route rather than waiting for a page unlucky
       enough to have all of its headings collapse at once. */
    if (clipped.length > 0) {
      console.log(`  FAIL ${path}  ${clipped.length} h2 clipped in capture mode`);
      console.log(`       ${clipped.join(" | ")}`);
      failures += 1;
      continue;
    }

    /* A route whose only h2s are the footer's sr-only landmarks is correct, not blind: /enquire is
       an h1 and a form. The failure is a route that should show headings and shows none. */
    if (visible.length === 0) {
      if (screenReader.length > 0) {
        console.log(`  ok   ${path}  no visible h2 by design (${screenReader.length} sr-only)`);
      } else {
        console.log(`  skip ${path}  (no h2 on this route)`);
      }
      continue;
    }

    console.log(
      `  ok   ${path}  ${visible.length} visible` +
        (screenReader.length > 0 ? `, ${screenReader.length} sr-only` : ""),
    );
  }

  await context.close();
}

await browser.close();

console.log(
  `\n${checked} captures checked across ${VIEWPORTS.length} viewports, ${failures} failed.`,
);
process.exit(failures > 0 ? 1 : 0);
