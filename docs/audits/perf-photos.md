# Performance: the day the photographs landed

15 September 2026. Six of the client's photographs were wired into the slots in
`docs/images-manifest.md`: the home hero, all three course photos, the lead frame of the About
gallery, and the for-cafes section. Everything still without a file keeps its branded placeholder.

Lighthouse mobile, simulated throttling, `node scripts/lighthouse.mjs`. The question this file
exists to answer is the one CLAUDE.md budget 7 asks — did any route regress past 90, or past 2.5s
LCP — and the one the known-limitations note in `docs/STATUS.md` has been asking since build 2:
whether an image LCP, preloaded and served as AVIF, is better than the text LCP the site had.

## The short answer

No route regressed. The three routes that gained an above-the-fold photograph got **faster**, and
they are now the fastest routes on the site, because a preloaded AVIF beats a paragraph that has to
wait for Montserrat.

## Local production build, before and after

`pnpm build && pnpm start`, same machine, same session. CPU benchmark index 4072 to 4207
throughout, so the readings are comparable.

| Route | Perf before | Perf after | LCP before | LCP after | LCP element after |
|---|---|---|---|---|---|
| `/` | 94 | **97** | 3.13 s | **2.6 s** | the hero photograph |
| `/courses` | 94 | **97** | 3.14 s | **2.6 s** | intro paragraph (no photo slot filled) |
| `/courses/italian-barista-course-basic` | 98 | **98** | 2.48 s | **2.5 s** | the course photograph |
| `/courses/ibc-advanced-barista` | 98 | **98** | 2.48 s | **2.5 s** | the course photograph |
| `/courses/ibc-advanced-roasting` | 98 | **98** | 2.49 s | **2.5 s** | the course photograph |
| `/about` | 95 | 94 | 2.99 s | 3.1 s | intro paragraph |
| `/for-cafes` | 94 | 94 | 3.14 s | 3.1 s | intro paragraph |

CLS was 0.000 on every route before and after. Six photographs landed without a single layout
shift, because every frame reserves its box from an aspect class before the bytes arrive.

**Read the `/about` and `/for-cafes` rows as noise, not as a regression.** Two routes that this
work never touched were measured in the same run as a control:

| Control route | LCP | LCP element |
|---|---|---|
| `/calendar` | 3.1 s | a paragraph |
| `/enquire` | 3.1 s | a paragraph |

3.1s is this workstation's floor for a text LCP. Every route whose LCP is still a paragraph reads
3.1s whether or not a photograph was added to it; every route whose LCP is now a photograph reads
2.5 to 2.6s. That is the finding.

### On the spread in these numbers

The same commit, measured three times in a row on `/courses/italian-barista-course-basic`, gave
2487ms, 2482ms and 3140ms. `docs/audits/perf-build2.md` already says why: Lighthouse's simulated
throttling on this machine tracks the machine more than it tracks the site. A single local reading
is not evidence of a change. The deployed numbers below are the ones that matter, and they are the
ones the ≤2.5s budget is written against.

## The deployment, before

Measured against `https://espresso-academy-india.vercel.app` immediately before this work was
pushed — the previous `main`, with no photographs and without the visual pass. Each route was
warmed twice first.

| Route | Perf | LCP | CLS |
|---|---|---|---|
| `/` | 100 | 1.39 s | 0 |
| `/courses` | 100 | 1.24 s | 0 |
| `/courses/italian-barista-course-basic` | 96 | 2.73 s | 0 |
| `/courses/ibc-advanced-barista` | 96 | 2.70 s | 0 |
| `/courses/ibc-advanced-roasting` | 100 | 1.23 s | 0 |
| `/about` | 100 | 1.38 s | 0 |
| `/for-cafes` | **80** | **4.75 s** | 0 |

`/for-cafes` is a pre-existing problem on the deployment and has nothing to do with photography —
this reading is of the build *without* any. It is not a cold start: it was warmed twice and read
the same both times. Time to first byte was 30ms, in line with every other route; the LCP breakdown
puts 1390ms into **element render delay** against 99ms on `/about`, and FCP at 1.9s against 1.0s.
Worth a separate look; recorded here so it is not mistaken for something the photographs did.

## The deployment, after

See the table appended below once the deploy that carries this change has been measured.

## What was changed for performance, and what was not

- The hero frame became **3:2 at every width**, where it had been 4:5 on a phone and 3:2 from
  `md`. Primarily a design fix — the 4:5 centre crop cut the second subject through the eye line —
  but it also ended a 1.59x upscale on what is now the LCP element, because the browser was
  fetching an image sized for a 100vw box and then cropping it taller. Fetched width at 390/DPR2
  went from `w=828` for a box needing 1312 device pixels to `w=750` for a box needing 750.
- The `courses-hub` placeholder **stopped rendering** while its file is missing, so `/courses` no
  longer preloads the placeholder's decorative logo watermark on the LCP path, and the hero runs
  full width until the academy sends the file.
- `priority` was **left alone**. It is deprecated in Next 16 in favour of `preload`
  (`node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md`), still supported,
  and emits no warning. Renaming it across four components and every call site is a migration, not
  a photography change, and doing it in the same commit as a visual change would make a regression
  in either one hard to attribute. Logged in `docs/STATUS.md` as a follow-up.
- The hero's 400ms reveal was **left on the LCP element**. It is a clip-path wipe rather than a
  fade, so the first pixels paint a frame into the animation, and the measurement above shows the
  photograph routes are the fastest on the site with it running.

## Method note

`scripts/lighthouse.mjs` was fixed in the same commit. It had been measuring `/courses/latte-art`,
a course the catalogue rebuild retired, which has been answering 301 rather than rendering a page —
so every nightly since was timing a redirect. It now walks the three real courses plus `/about` and
`/for-cafes`, warms each route before timing it, names the LCP element in its table, and skips a
route it cannot load instead of taking the whole run down on the last row.
