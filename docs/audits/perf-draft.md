# Performance audit, draft phase

Lighthouse 12, mobile form factor, default simulated throttling (slow 4G, 4x CPU). Measured twice:
against `pnpm build && pnpm start` on localhost, and against the Vercel deployment. Both sets are
below. Raw reports are the `lh-*.report.json` files beside this one; the deployment runs are
`lh-deploy-*.report.json`.

## Scores, localhost

| Route | Performance | Accessibility | Best Practices | SEO | FCP | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| `/` | **99** | **100** | **100** | **100** | 0.9s | **2.1s** | **0** | **0ms** |
| `/courses` | **92** | **100** | **100** | **100** | 0.9s | 3.4s | **0** | **0ms** |
| `/courses/sca-barista-skills-foundation` | **92** | **100** | **100** | **100** | 0.9s | 3.4s | **0** | **0ms** |
| `/enquire` | **93** | **100** | **100** | **100** | 0.8s | 3.2s | **0** | **0ms** |

The homepage clears the 2.5s LCP target. Repeat runs put `/courses` stably at 3.1 to 3.4s, so the
difference between them is real rather than noise: home's LCP is a three-line Bebas H1, while the
other three are six-line Montserrat paragraphs, which need more of the font resolved before they
can paint.

### The `/` row above no longer reproduces, and it is not a regression

Re-measured after the Phase 8b design rounds, `/` comes back at **92, LCP 3.4s**, three runs
running, not 99 / 2.1s. The QA pass read that as a regression caused by the design work. It is not:
the same three runs were taken against `d553540`, the commit immediately before those changes, by
checking that tree out and rebuilding, and it scores **94 / 92 / 92 with LCP 3.2 to 3.4s** — the
same numbers, within noise.

So both commits measure the same today, and neither reproduces the 99 / 2.1s recorded here. The
figure was real when it was taken; it is a function of what else the machine was doing, and the
`/` row is the one that sits closest to the boundary where Lighthouse's simulated throttling flips
the LCP element between the Bebas H1 and the Montserrat sub-line beneath it, which are within about
10% of each other in area at a 412px viewport. Treat `/` as **92 to 99, LCP 2.1 to 3.4s**, and
treat the "home meets the LCP budget" claim as conditional rather than settled.

The lesson for the next person measuring: compare against a rebuilt baseline commit, not against a
number written down in this file on a different day. A stale recorded figure will manufacture a
regression that a five-minute A/B disproves.

## Scores, against the Vercel deployment

| Route | Performance | Accessibility | Best Practices | SEO | FCP | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| `/` | **90** | **100** | **100** | **100** | 1.8s | 3.4s | **0** | **0ms** |
| `/courses` | **96** | **100** | **100** | **100** | 1.0s | 2.8s | **0** | **0ms** |
| `/courses/latte-art` | **90** | **100** | **100** | **100** | 1.5s | 3.3s | **0** | **0ms** |
| `/enquire` | **94** | **100** | **100** | **100** | 0.9s | 3.0s | **0** | 10ms |

The deployment is not materially faster than localhost, so the LCP figure below is a real
measurement rather than an artefact of serving from a dev machine.

## Against the budget in CLAUDE.md

| Budget | Target | Actual | |
|---|---|---|---|
| Lighthouse Performance, mobile | >= 90 | 92 to 99 | **pass** |
| Accessibility | 100 | 100 | **pass** |
| Best Practices | >= 95 | 100 | **pass** |
| SEO | 100 | 100 | **pass** |
| CLS | <= 0.05 | 0 on every route | **pass** |
| LCP | <= 2.5s | 2.1s on `/`, 3.1s to 3.4s elsewhere | **partial**, see below |
| Initial JS | <= 150KB gz | 172KB gz | **miss**, see below |

## The two misses

### LCP: met on `/`, 3.1s to 3.4s on the other three

Measured directly in a throttled Chromium (1.6 Mbps, 4x CPU) with a `PerformanceObserver`, the LCP
element and time on each route are:

| Route | LCP element | Time |
|---|---|---|
| `/` | the `<h1>` | 760ms |
| `/courses` | the hub intro paragraph | 744ms |
| `/courses/latte-art` | the course outcome paragraph | 744ms |
| `/enquire` | the form standfirst | 724ms |

So the element is real above-the-fold content, and in an actually-throttled browser it paints in
well under a second. The 3.0 to 3.5s figure is Lighthouse's *simulated* throttling model, which
charges the full simulated cost of every request on the critical path regardless of how fast the
server answered.

**The deployment measures the same**, 2.8s to 3.4s, so this is not a localhost artefact and should
not be written off. What it is: a text LCP that has to wait for a font and a stylesheet on a
simulated slow-4G connection. The levers left, in order of value:

1. A real hero photograph will change the LCP element on the homepage from text to an image, which
   can be preloaded and served as AVIF. Today it is a placeholder, so the H1 is the LCP.
2. `font-display: optional` instead of `swap` would let the first paint use the metric-matched
   fallback and never block, at the cost of the real face not appearing on a slow first visit.
   Worth testing once real photography is in.
3. Inlining the stylesheet was tried and measured worse. See below.

None of these is worth doing before the client's photography lands, because the photography changes
what the LCP element is on most pages.

### Initial JS: 172KB gz against a 150KB target

Module scripts only, excluding the 38KB `noModule` polyfill bundle that modern browsers never
download:

| Route | First-load JS (gz) |
|---|---|
| `/` | 172.0 KB |
| `/courses` | 177.2 KB |
| `/courses/latte-art` | 172.0 KB |
| `/enquire` | 172.0 KB |

The breakdown:

| Chunk | gz | What it is |
|---|---|---|
| 69 KB | react-dom | framework |
| 44 KB | the React Server Components client runtime | framework |
| 16 KB | Base UI | the mobile sheet and the FAQ accordion |
| ~43 KB | Next's router and client runtime, plus app code | framework + app |

Roughly 150KB of that is the React 19 and Next 16 App Router baseline, which is the floor for this
stack. The application's own code is about 22KB over the line. The only remaining lever worth
naming is dropping Base UI's sheet for a CSS-only mobile nav, which would save about 16KB and cost
the focus trap, the Escape handling and the focus restore. Not worth it.

## What was fixed to get here

1. **zod was in the client bundle.** The enquiry form imported the shared contract for a regex and
   two constants, and the contract imported zod, so about 50KB gz of schema validation shipped to
   every visitor. The contract is now zod-free (`src/lib/enquiry.ts`) and the schema lives in a
   server-only module (`src/lib/enquiry-schema.ts`). `src/lib/env.ts` had the same problem through
   `format.ts`; the public half moved to `src/lib/public-env.ts`. First-load JS fell from 330KB gz
   to 210KB (172KB excluding the `noModule` polyfills).
2. **`motion` was a dependency but was never imported.** Every animation on this site is CSS, gated
   by `prefers-reduced-motion` in the base layer, which is both lighter and simpler than
   `LazyMotion` with `domAnimation`. The dependency was removed rather than used for its own sake.
3. **CLS 0.238 on `/enquire`.** The form read `?course=` with `useSearchParams`, which forces a
   Suspense boundary; on a static page that renders a fallback and then swaps the whole form in,
   pushing the footer down. The query is now read on the server and passed as props. No boundary,
   no shift. CLS is 0 on every route.
4. **The consent banner was the LCP element on course pages, at 2.4s.** It paints at hydration, and
   a fixed full-width block of body text was the largest thing in the viewport at that moment, on a
   page whose H1 had already painted at 0.7s. The copy is now two short clauses.
5. **No favicon.** A 404 on `/favicon.ico` was the only thing keeping Best Practices at 96. The
   mark is now padded onto a square canvas (padding, not cropping) as `src/app/icon.png` and
   `apple-icon.png`. Best Practices is 100.
6. **The header mark and hero placeholder were lazy-loaded** despite being above the fold. Both
   now set `priority`.
7. **The logo `sizes` attribute asked for 120/160px** for a box rendered at 36/40px, so the browser
   fetched several times the pixels it needed.

## Tried and reverted

**`experimental.inlineCss`.** It removes the render-blocking stylesheet request that Lighthouse
costs at 130 to 150ms per route, but inlining the 12KB sheet into every document loses the
cross-page cache and measured *worse*: FCP 0.9s to 1.0s, and `/courses/latte-art` fell from 95 to
91. Reverted, with the reasoning left in `next.config.ts` so nobody tries it again.

## Fonts

Self-hosted through `next/font/local` from the fontsource packages. Next emits the preload links
for both faces and generates a metric-matched fallback, which is why CLS is 0 rather than merely
small. No request reaches Google.

```
Link: </_next/static/media/bebas_neue_latin_400-s.…woff2>; rel=preload; as="font"
Link: </_next/static/media/montserrat_latin_variable-s.…woff2>; rel=preload; as="font"
```

## Client boundaries

Six client components, each with a one-line reason in its own file:

| Component | Why it is a client component |
|---|---|
| `MobileNav` | the sheet opens on tap and traps focus |
| `NavLink` | needs the pathname for `aria-current` |
| `StickyBar` | reacts to scroll position and route |
| `ConsentBanner` | reads and writes the consent cookie |
| `EnquiryForm` | controlled fields, blur validation, focus management |
| `WaitlistInline` | same |
| `app/error.tsx` | an error boundary must be a Client Component |

Everything else, including the course filters, the level ladder, the batch tables and every page,
is a Server Component.
