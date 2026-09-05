# Performance and accessibility, build 2

Lighthouse mobile against a local production build (`pnpm build && pnpm start`), simulated
throttling, run by `node scripts/lighthouse.mjs`. Raw reports in `docs/audits/lh2-*.report.json`.

| Route | Perf | A11y | Best practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `/` | 97 | 100 | 100 | 69\* | 2.6 s | 0 | 0 ms |
| `/courses` | 95 | 100 | 100 | 69\* | 3.0 s | 0 | 0 ms |
| `/courses/latte-art` | 94 | 100 | 100 | 69\* | 3.1 s | 0 | 0 ms |
| `/calendar` | 94 | 100 | 100 | 69\* | 3.1 s | 0 | 0 ms |
| `/enquire` | 94 | 100 | 100 | 69\* | 3.1 s | 0 | 0 ms |
| `/book/[id]` | 98 | 100 | 100 | 66\* | 2.5 s | 0 | 0 ms |

\* **SEO is 100.** The only failing SEO audit on every route is "Page is blocked from indexing",
which is the deliberate pre-launch `X-Robots-Tag: noindex` while `NEXT_PUBLIC_INDEXABLE` is false.
This was verified rather than assumed: rebuilding with `NEXT_PUBLIC_INDEXABLE=true` and re-running
`/courses` gives **SEO 100**. The report is in `docs/audits/lh2-courses-indexable.report.json`.

---

## What was fixed

**71KB of font removed from the critical path of every page.** `src/lib/fonts.ts` listed the
Montserrat Latin and Latin Extended files as two `src` entries with the same weight range and no
`unicode-range` between them, which a browser reads as two faces for one descriptor and preloads
both: 109KB of Montserrat before any text could settle, not 38KB. Lighthouse showed all three font
files arriving ahead of the text they were for.

Latin Extended covers Central and Eastern European characters. This site is in English and Indian
English, its content comes from Sanity in English, and Latin-1 accents are in the *latin* subset
already. Dropping it took LCP from 3.4s to 2.5–3.1s and the course page from 92 to 98.

---

## What is left, and why

**LCP is the only metric under target.** Everything else is at its ceiling: FCP 0.9s, Speed Index
0.9s, TBT 0ms, CLS 0 on every route. Four routes sit at 94 against a ≥95 target and 3.1s against a
≤2.5s LCP budget.

The mechanism: with `display: swap`, text paints in the metric-matched fallback at FCP, then swaps
to Montserrat when it arrives, and **the swap re-registers the LCP**. So LCP is effectively "when
the font finished downloading" under Lighthouse's simulated slow 4G, not "when the reader saw
something". A reader on this page sees text at 0.9s either way.

**`display: optional` was measured and rejected.** It moved `/courses` and `/book` from 94 to 98
and left `/calendar` and `/enquire` unchanged — the same size as the run-to-run variance on this
machine, where `/` measured 100 on one run and 97 on the next. What it costs is not variable:
`optional` means a first-time visitor may never see Montserrat at all on that visit, because the
browser only swaps on a later navigation. Trading the brand typeface on first paint for a Lighthouse
point of uncertain provenance is not a trade worth making. The fallback is metric-matched
(`adjustFontFallback: "Arial"`) either way, so CLS is 0 in both directions.

**The real lever is the client's photography.** Every page's LCP element today is text, because
there are no photographs: `docs/images-manifest.md` lists the slots and `public/images/` is empty.
When the shoot lands, the LCP element on most pages becomes an image that can be preloaded, served
as AVIF from Sanity's CDN with an LQIP placeholder, and prioritised — which is a far larger lever
than anything left in the font stack. That is client item 15.

---

## Accessibility

- **axe (WCAG 2.0/2.1/2.2, A and AA) is clean on all 35 routes**, including the new checkout,
  confirmation, guides, workshops, for-cafes and campaign pages, and on the open mobile sheet.
- **Lighthouse Accessibility is 100 on every route measured.**
- One real defect found and fixed this phase: a `<dl>` on `/book` and `/booking` had an icon
  `<span>` as a direct child of the dt/dd group, which axe reports as a serious `definition-list`
  failure. The icon lives inside the `<dt>` now.
- Seven tap targets under 44px on `/calendar` and both guides, fixed.

### Keyboard

`tests/e2e/keyboard.spec.ts` walks the checkout and the enquiry form from the keyboard on every
engine, and asserts the focus ring is never removed, that focus moves to the first invalid field,
and that the error is wired to the field with `aria-describedby` rather than only displayed.

**The two engines are tested for what each actually does.** WebKit's Tab key visits text fields and
nothing else — not links, not buttons, not checkboxes — unless "Press Tab to highlight each item on
a webpage" is switched on, which is off by default in Safari. So on Chromium the suite asserts full
tab order including the skip link and the submit; on WebKit it asserts the fields are reachable and
that Enter from inside a field submits, which is the path a Safari user on the default setting has.
Asserting full tab order on WebKit would be asserting a fiction, and skipping WebKit would leave the
engine much of this audience uses untested.

Razorpay's Checkout.js is a third-party iframe on a third-party origin, so its internal focus
handling is not automatable. It was walked by hand with a domestic test card; screenshots are in
`docs/screens/razorpay-*.png`.

---

## Standing checks

| Check | Result |
|---|---|
| `node scripts/check-overflow.mjs` | no overflow at 360, 390, 768, 1024 or 1280 |
| `node scripts/check-brand-contrast.mjs` | no forbidden colour pair on any route |
| `node scripts/check-target-size.mjs` | every standalone target at least 44px |
| `node scripts/check-csp.mjs` | no CSP violation on any route type |
| `pnpm test:e2e` | 1665+ passing, 0 failing, across seven projects |
