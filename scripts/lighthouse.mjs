#!/usr/bin/env node
/**
 * Lighthouse against a local production build, mobile emulation, for the routes that matter.
 *
 * Mobile rather than desktop because the audience is 64% mobile, and simulated throttling because
 * that is what the budget in CLAUDE.md is written against. Writes one JSON per route into
 * docs/audits/ and prints the table that goes into docs/audits/perf-build2.md.
 *
 * The first measured route used to be measured on a cold machine: `npx` was still fetching
 * Lighthouse, Chrome had never been launched, and nothing was in the page cache. On a workstation
 * that costs nothing, but on the two-core runner the nightly uses it cost the homepage 22% of its
 * CPU benchmark and roughly double everyone else's main-thread total, two nights running. There is
 * a discarded warm-up pass now, and every row prints the benchmark index it was measured at, so a
 * score that moved because the machine was slow can be told apart from one that moved because the
 * site changed.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

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

function measure(path, out) {
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
  return JSON.parse(readFileSync(out, "utf8"));
}

// Thrown away. It exists to pay the cold costs — the npx fetch, Chrome's first launch, the first
// TLS handshake to the origin — before anything that gets reported.
measure(ROUTES[0][0], join(tmpdir(), "lh-warmup.report.json"));

const rows = [];
for (const [path, name] of ROUTES) {
  const out = `docs/audits/lh2-${name}.report.json`;
  const d = measure(path, out);
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
    bench: Math.round(d.environment?.benchmarkIndex ?? 0),
  });
  const r = rows.at(-1);
  console.log(
    `${r.route.padEnd(32)} perf ${String(r.perf).padStart(3)}  a11y ${String(r.a11y).padStart(3)}` +
      `  bp ${String(r.bp).padStart(3)}  seo ${String(r.seo).padStart(3)}` +
      `  LCP ${r.lcp.padStart(7)}  CLS ${r.cls.padStart(5)}  TBT ${r.tbt.padStart(8)}` +
      `  cpu ${String(r.bench).padStart(5)}`,
  );
}

// A run whose slowest machine reading is far below its fastest was measured on a machine that was
// busy, and its scores are not comparable with the last one. Say so rather than leaving whoever
// reads the table to wonder.
const benches = rows.map((r) => r.bench).filter(Boolean);
if (benches.length > 1 && Math.min(...benches) < Math.max(...benches) * 0.85) {
  console.log(
    `\nNote: the CPU benchmark index ranged ${Math.min(...benches)} to ${Math.max(...benches)} across` +
      ` this run, so these scores are not comparable route to route.`,
  );
}

console.log("\n| Route | Perf | A11y | Best practices | SEO | LCP | CLS | TBT |");
console.log("|---|---|---|---|---|---|---|---|");
for (const r of rows) {
  console.log(`| \`${r.route}\` | ${r.perf} | ${r.a11y} | ${r.bp} | ${r.seo} | ${r.lcp} | ${r.cls} | ${r.tbt} |`);
}
