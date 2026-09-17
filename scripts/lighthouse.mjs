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
/*
 * `/courses/latte-art` was measured here from build 2 until the photography landed, by which time
 * it had been a 301 for a month: the catalogue rebuild retired it, so every nightly was timing a
 * redirect rather than a course page. The three real courses are listed instead, which is also
 * what the photography touches — each carries a hero photograph now, and a course page's LCP
 * element is that photograph.
 *
 * /about and /for-cafes join them for the same reason. They were the two routes carrying a photo
 * slot that nothing measured.
 */
const ROUTES = [
  ["/", "home"],
  ["/courses", "courses"],
  ["/courses/italian-barista-course-basic", "course-ibc-basic"],
  ["/courses/ibc-advanced-barista", "course-ibc-advanced-barista"],
  ["/courses/ibc-advanced-roasting", "course-ibc-advanced-roasting"],
  ["/about", "about"],
  ["/for-cafes", "for-cafes"],
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
const skipped = [];
for (const [path, name] of ROUTES) {
  /*
   * Warm the route before timing it. Against a deployment, four of these are server-rendered on
   * demand, and the first request after an idle period pays for a cold function: measured against
   * the deployment on 15 September, /for-cafes came back at performance 80 and FCP 1.9s cold
   * against 100 and 1.0s for its neighbours. That is Vercel's scheduler, not the page.
   */
  for (let i = 0; i < 2; i++) {
    try {
      await fetch(BASE + path, { cache: "no-store" });
    } catch {
      // A failed warm-up is not a failed measurement; Lighthouse will report the real state.
    }
  }
  const out = `docs/audits/lh2-${name}.report.json`;

  /*
   * A route this dataset does not carry is skipped, not fatal. `/book/instance-e2e-test-batch`
   * needs the batch that `pnpm sanity:seed:test-batch` writes into the ci dataset, so against a
   * production-dataset build it 404s and Lighthouse exits non-zero — which used to take the whole
   * run down on its last row, after nine routes had already been measured and printed. What was
   * skipped is named at the end rather than quietly dropped.
   */
  let d;
  try {
    d = measure(path, out);
  } catch {
    skipped.push(path);
    console.log(`${path.padEnd(32)} skipped: Lighthouse could not load it (404 in this dataset?)`);
    continue;
  }
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
    /* Which element was measured. Since the photography landed this is the interesting half of
       the LCP row: a photograph and a paragraph are improved by different things. */
    lcpEl:
      a["lcp-breakdown-insight"]?.details?.items?.find((i) => i.type === "node")?.nodeLabel ?? "?",
    bench: Math.round(d.environment?.benchmarkIndex ?? 0),
  });
  const r = rows.at(-1);
  console.log(
    `${r.route.padEnd(32)} perf ${String(r.perf).padStart(3)}  a11y ${String(r.a11y).padStart(3)}` +
      `  bp ${String(r.bp).padStart(3)}  seo ${String(r.seo).padStart(3)}` +
      `  LCP ${r.lcp.padStart(7)}  CLS ${r.cls.padStart(5)}  TBT ${r.tbt.padStart(8)}` +
      `  cpu ${String(r.bench).padStart(5)}  <- ${r.lcpEl.slice(0, 44)}`,
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

if (skipped.length > 0) {
  console.log(`\n${skipped.length} route(s) skipped: ${skipped.join(", ")}.`);
}

console.log("\n| Route | Perf | A11y | Best practices | SEO | LCP | CLS | TBT | LCP element |");
console.log("|---|---|---|---|---|---|---|---|---|");
for (const r of rows) {
  console.log(
    `| \`${r.route}\` | ${r.perf} | ${r.a11y} | ${r.bp} | ${r.seo} | ${r.lcp} | ${r.cls} | ${r.tbt} | ${r.lcpEl.slice(0, 44)} |`,
  );
}
