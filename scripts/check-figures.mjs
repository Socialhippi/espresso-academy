/**
 * Does any money figure break across two lines?
 *
 * The overflow probe measures the document, so a price that wraps between "₹31," and "506" inside
 * a table cell passes it clean. That is the failure this catches, and it is the failure a field
 * going non-null tends to cause: every fee cell that held one figure now holds three, because the
 * client confirmed the GST rate and the site prints both the ex-GST fee and the total.
 *
 * The same lesson twice already: `settings.email` went from a 40px TBC pill to a 29-character
 * unbreakable token and pushed every route 127px sideways at 1024, and made a 26px touch target.
 * A pill is not a value. Measure the routes a field touches on the day it stops being null.
 *
 *   node scripts/check-figures.mjs [baseUrl]
 */
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3000";
const manifest = JSON.parse(readFileSync("tests/routes.json", "utf8"));
const optional = new Set(manifest.nonIndexedRoutes.map((r) => r.path));
const paths = [
  ...manifest.routes.map((r) => r.path),
  ...manifest.nonIndexedRoutes.map((r) => r.path),
];

/* The three widths the client reviews on. 1024 is here because that is where the footer's four
   columns are tightest and where the email overflow lived. */
const WIDTHS = [390, 1024, 1280];

const browser = await chromium.launch();
let broken = 0;
let skipped = 0;

for (const width of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 1000 } });
  console.log(`\n=== ${width}px ===`);

  for (const path of paths) {
    const response = await page.goto(base + path, { waitUntil: "domcontentloaded" });
    const status = response?.status() ?? 0;
    if (status === 404 && optional.has(path)) {
      skipped++;
      console.log(`skip 404 ${path} (not in this dataset)`);
      continue;
    }

    const offenders = await page.evaluate(() => {
      const out = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node.nodeValue ?? "";
        // `[\d,]*\d` so a comma after the figure in a sentence is not part of it.
        for (const match of text.matchAll(/₹\s?[\d,]*\d/g)) {
          const range = document.createRange();
          range.setStart(node, match.index);
          range.setEnd(node, match.index + match[0].length);
          // More than one client rect means the browser laid the figure out on two lines.
          if (range.getClientRects().length > 1) {
            const parent = node.parentElement;
            out.push(
              `${match[0]} split across lines in <${parent?.tagName.toLowerCase()} class="${(parent?.getAttribute("class") ?? "").slice(0, 60)}">`,
            );
          }
        }
      }
      return [...new Set(out)];
    });

    if (offenders.length > 0) {
      broken += offenders.length;
      console.log(`FAIL ${path}\n      ${offenders.join("\n      ")}`);
    } else {
      console.log(`ok   ${path}`);
    }
  }

  await page.close();
}

await browser.close();
console.log(
  broken === 0
    ? `\nNo money figure breaks across lines at ${WIDTHS.join(", ")}.`
    : `\n${broken} broken figure(s).`,
);
if (skipped > 0) {
  console.log(`${skipped} check(s) skipped: a non-indexed route that this dataset does not carry.`);
}
process.exit(broken === 0 ? 0 : 1);
