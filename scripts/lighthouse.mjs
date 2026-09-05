#!/usr/bin/env node
/**
 * Lighthouse against a local production build, mobile emulation, for the routes that matter.
 *
 * Mobile rather than desktop because the audience is 64% mobile, and simulated throttling because
 * that is what the budget in CLAUDE.md is written against. Writes one JSON per route into
 * docs/audits/ and prints the table that goes into docs/audits/perf-build2.md.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, mkdirSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:3000";
const ROUTES = [
  ["/", "home"],
  ["/courses", "courses"],
  ["/courses/latte-art", "course"],
  ["/calendar", "calendar"],
  ["/enquire", "enquire"],
  ["/book/instance-e2e-test-batch", "book"],
];

mkdirSync("docs/audits", { recursive: true });

const rows = [];
for (const [path, name] of ROUTES) {
  const out = `docs/audits/lh2-${name}.report.json`;
  execFileSync(
    "npx",
    [
      "--yes", "lighthouse@latest", BASE + path,
      "--form-factor=mobile",
      "--throttling-method=simulate",
      "--only-categories=performance,accessibility,best-practices,seo",
      "--output=json",
      `--output-path=${out}`,
      "--quiet",
      '--chrome-flags=--headless=new --no-sandbox',
    ],
    { stdio: ["ignore", "ignore", "ignore"] },
  );

  const d = JSON.parse(readFileSync(out, "utf8"));
  const score = (k) => {
    const v = d.categories[k]?.score;
    return v === null || v === undefined ? "-" : Math.round(v * 100);
  };
  const a = d.audits;
  rows.push({
    route: path,
    perf: score("performance"),
    a11y: score("accessibility"),
    bp: score("best-practices"),
    seo: score("seo"),
    lcp: a["largest-contentful-paint"].displayValue,
    cls: a["cumulative-layout-shift"].displayValue,
    tbt: a["total-blocking-time"].displayValue,
  });
  const r = rows.at(-1);
  console.log(
    `${r.route.padEnd(32)} perf ${String(r.perf).padStart(3)}  a11y ${String(r.a11y).padStart(3)}` +
      `  bp ${String(r.bp).padStart(3)}  seo ${String(r.seo).padStart(3)}` +
      `  LCP ${r.lcp.padStart(7)}  CLS ${r.cls.padStart(5)}  TBT ${r.tbt.padStart(8)}`,
  );
}

console.log("\n| Route | Perf | A11y | Best practices | SEO | LCP | CLS | TBT |");
console.log("|---|---|---|---|---|---|---|---|");
for (const r of rows) {
  console.log(`| \`${r.route}\` | ${r.perf} | ${r.a11y} | ${r.bp} | ${r.seo} | ${r.lcp} | ${r.cls} | ${r.tbt} |`);
}
