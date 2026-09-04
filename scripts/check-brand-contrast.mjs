/**
 * Brand contrast guard. axe covers the WCAG floor; this checks the two pairs design.md forbids
 * outright, which are legal in general but wrong for this brand:
 *   - red or red-deep text on the black or black-2 grounds (2.47:1)
 *   - mustard used as a text colour anywhere
 */
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3000";
const manifest = JSON.parse(readFileSync("tests/routes.json", "utf8"));
const paths = [...manifest.routes, ...manifest.nonIndexedRoutes].map((r) => r.path);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
let failures = 0;

for (const path of paths) {
  await page.goto(base + path, { waitUntil: "networkidle" });
  const found = await page.evaluate(() => {
    const RED = ["rgb(178, 0, 3)", "rgb(100, 0, 0)"];
    const DARK = ["rgb(23, 23, 23)", "rgb(55, 55, 55)"];
    const MUSTARD = "rgb(241, 189, 0)";
    const problems = [];

    const groundOf = (el) => {
      for (let node = el; node; node = node.parentElement) {
        const bg = getComputedStyle(node).backgroundColor;
        if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") return bg;
      }
      return "rgb(255, 255, 255)";
    };

    for (const el of document.querySelectorAll("body *")) {
      const hasOwnText = Array.from(el.childNodes).some(
        (n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim(),
      );
      if (!hasOwnText) continue;
      const style = getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none") continue;
      const colour = style.color;
      const ground = groundOf(el);
      const label = `${el.tagName.toLowerCase()}.${String(el.className).split(" ").slice(0, 3).join(".")}`;
      if (colour === MUSTARD) problems.push(`mustard text on ${label}`);
      if (RED.includes(colour) && DARK.includes(ground)) {
        problems.push(`red text on a dark ground: ${label}`);
      }
    }
    return problems;
  });

  if (found.length) {
    failures += found.length;
    console.log(`FAIL ${path}`);
    for (const problem of [...new Set(found)]) console.log(`      ${problem}`);
  } else {
    console.log(`ok   ${path}`);
  }
}

await browser.close();
console.log(
  failures === 0
    ? "\nNo forbidden colour pair renders anywhere."
    : `\n${failures} forbidden pair(s) found.`,
);
process.exit(failures === 0 ? 0 : 1);
