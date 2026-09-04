/**
 * Quick horizontal-overflow probe at 390px. Standalone from the Playwright suite so it can be run
 * against a dev server mid-phase without the full test harness.
 */
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3000";
const manifest = JSON.parse(readFileSync("tests/routes.json", "utf8"));
const paths = [
  ...manifest.routes.map((r) => r.path),
  ...manifest.nonIndexedRoutes.map((r) => r.path),
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
let failures = 0;

for (const path of paths) {
  const response = await page.goto(base + path, { waitUntil: "domcontentloaded" });
  const status = response?.status() ?? 0;
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
      offenders: over.slice(0, 4),
    };
  });
  const overflow = result.scrollWidth > result.innerWidth;
  if (overflow || status !== 200) failures++;
  console.log(
    `${overflow || status !== 200 ? "FAIL" : "ok  "} ${status} ${path} scrollWidth=${result.scrollWidth} h1=${result.h1}` +
      (result.offenders.length ? `\n      ${result.offenders.join("\n      ")}` : ""),
  );
}

await browser.close();
console.log(failures === 0 ? "\nNo overflow at 390." : `\n${failures} route(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
