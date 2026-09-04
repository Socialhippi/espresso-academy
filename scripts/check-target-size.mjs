/**
 * Touch-target guard. .claude/rules/a11y.md sets 44x44 with 8px spacing; WCAG 2.2 AA (2.5.8) sets
 * 24x24 as the floor. axe only enforces the WCAG floor, and the design reviews kept finding links
 * between those two numbers, so this walks every route and reports anything under 44px that is not
 * inline in a sentence.
 *
 * Inline links inside running prose are exempt: WCAG exempts them, and padding a link inside a
 * paragraph to 44px breaks the line rhythm of the paragraph it sits in.
 */
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3000";
const MIN = 44;
const manifest = JSON.parse(readFileSync("tests/routes.json", "utf8"));
/* The component gallery is excluded: it renders the raw shadcn primitives at their own 32px so
   the difference from the 48px brand button is visible, which is the point of showing them. */
const paths = manifest.routes.map((r) => r.path);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
let total = 0;

for (const path of paths) {
  await page.goto(base + path, { waitUntil: "networkidle" });
  const small = await page.evaluate((min) => {
    const isInlineInProse = (el) => {
      const parent = el.parentElement;
      if (!parent) return false;
      if (!["P", "LI", "SPAN", "ADDRESS", "DD", "DT", "BLOCKQUOTE", "LABEL"].includes(parent.tagName)) return false;
      // Prose only if the parent holds text beyond this element.
      return (parent.textContent ?? "").trim().length > (el.textContent ?? "").trim().length + 3;
    };
    /* An input's real target includes any label associated with it: tapping the label toggles
       the control. A 24px checkbox next to a two-line sentence is a large target, not a small one. */
    const targetBox = (el) => {
      const r = el.getBoundingClientRect();
      if (!el.id) return r;
      const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (!label) return r;
      const lr = label.getBoundingClientRect();
      return {
        width: Math.max(r.right, lr.right) - Math.min(r.left, lr.left),
        height: Math.max(r.bottom, lr.bottom) - Math.min(r.top, lr.top),
      };
    };
    const out = [];
    for (const el of document.querySelectorAll("a[href], button, input, select, textarea, summary")) {
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      if (el.closest(".sr-only") || (style.position === "absolute" && r.width <= 1)) continue;
      const box = targetBox(el);
      if (box.height >= min && box.width >= min) continue;
      if (isInlineInProse(el)) continue;
      out.push(
        `${el.tagName.toLowerCase()} "${(el.textContent ?? "").trim().slice(0, 34)}" ${Math.round(box.width)}x${Math.round(box.height)}`,
      );
    }
    return [...new Set(out)];
  }, MIN);

  if (small.length) {
    total += small.length;
    console.log(`FAIL ${path}`);
    for (const s of small) console.log(`      ${s}`);
  } else {
    console.log(`ok   ${path}`);
  }
}

await browser.close();
console.log(
  total === 0
    ? `\nEvery standalone target is at least ${MIN}px.`
    : `\n${total} target(s) under ${MIN}px.`,
);
process.exit(total === 0 ? 0 : 1);
