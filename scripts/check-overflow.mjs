/**
 * Horizontal-overflow probe at all three design widths. Standalone from the Playwright suite so it
 * can be run against a dev server mid-phase without the full test harness.
 *
 * 768 is in here because it was not, and a design review found a 17px document overflow and a
 * crushed header living there: the two widths either side had been clean the whole time.
 */
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3000";
const manifest = JSON.parse(readFileSync("tests/routes.json", "utf8"));
const paths = [
  ...manifest.routes.map((r) => r.path),
  ...manifest.nonIndexedRoutes.map((r) => r.path),
];

/** The three widths .claude/rules/design.md names: phone, tablet, desktop. */
/* 1024 is in here for the same reason 768 is. The header's nav returns at lg, and at exactly lg
   the row measured 1026px against a 1024px viewport: the Enquire pill was clipped and the right
   gutter was gone, on every route. 390, 768 and 1280 were all clean while that was true.

   360 is here for the third instance of the same lesson: the brand lockup pushed every route
   9px sideways at 360, the commonest Android width in this market, while 375 and 390 were clean.
   The pattern is that defects live at the widths nobody listed, so the list is the guard. */
const WIDTHS = [360, 390, 768, 1024, 1280];

/*
 * A route that only exists in one dataset is a skip, not a failure.
 *
 * /book/<id> hangs off a batch document. The ₹1 end-to-end batches live in the `ci` dataset and
 * were deleted from production when the real September and October batches landed, so this route
 * 404s against production and renders normally against ci. Reporting that as FAIL five times, once
 * per width, trains whoever runs this to skim past red — which is the failure mode a standing
 * script exists to avoid. A 404 on an indexed route is still a failure; only the non-indexed ones,
 * which are the dataset-dependent ones, are allowed to be absent.
 */
const optional = new Set(manifest.nonIndexedRoutes.map((r) => r.path));

const browser = await chromium.launch();
let failures = 0;
let skipped = 0;

for (const width of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  console.log(`\n=== ${width}px ===`);

  for (const path of paths) {
    const response = await page.goto(base + path, { waitUntil: "domcontentloaded" });
    const status = response?.status() ?? 0;

    if (status === 404 && optional.has(path)) {
      skipped++;
      console.log(`skip 404 ${path} (not in this dataset)`);
      continue;
    }

    const result = await page.evaluate(() => {
      const doc = document.documentElement;
      const over = [];
      // An element wider than the viewport is only a real offender when nothing above it clips or
      // scrolls: a wide table inside an overflow-x-auto wrapper is working as intended.
      const isClipped = (el) => {
        for (let p = el.parentElement; p && p !== doc; p = p.parentElement) {
          const ox = getComputedStyle(p).overflowX;
          if (ox === "auto" || ox === "scroll" || ox === "hidden" || ox === "clip") return true;
        }
        return false;
      };
      if (doc.scrollWidth > window.innerWidth) {
        for (const el of document.querySelectorAll("body *")) {
          const r = el.getBoundingClientRect();
          if ((r.right > window.innerWidth + 1 || r.left < -1) && !isClipped(el)) {
            over.push(
              `${el.tagName.toLowerCase()}.${String(el.className).split(" ").slice(0, 4).join(".")} [${Math.round(r.left)}..${Math.round(r.right)}]`,
            );
          }
        }
      }
      return {
        scrollWidth: doc.scrollWidth,
        innerWidth: window.innerWidth,
        h1: document.querySelectorAll("h1").length,
        offenders: [...new Set(over)].slice(0, 4),
      };
    });

    const overflow = result.scrollWidth > result.innerWidth;
    if (overflow || status !== 200) failures++;
    console.log(
      `${overflow || status !== 200 ? "FAIL" : "ok  "} ${status} ${path} scrollWidth=${result.scrollWidth} h1=${result.h1}` +
        (result.offenders.length ? `\n      ${result.offenders.join("\n      ")}` : ""),
    );
  }

  await page.close();
}

await browser.close();
console.log(
  failures === 0
    ? `\nNo overflow at ${WIDTHS.join(", ")}.`
    : `\n${failures} route/width combination(s) failed.`,
);
if (skipped > 0) {
  console.log(`${skipped} check(s) skipped: a non-indexed route that this dataset does not carry.`);
}
process.exit(failures === 0 ? 0 : 1);
