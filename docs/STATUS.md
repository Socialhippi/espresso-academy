# Status: Espresso Academy India website

Running log of what is built, what is waiting on the client, and what a developer still has to
do. Updated at the end of every phase.

**Preview URL:** _pending (Phase 9)_

---

## Done

### Phase 0: scaffold

- Next.js 16.3.4 (App Router, Turbopack), React 19.2.8, TypeScript strict, Tailwind v4.3.3, pnpm.
- shadcn/ui on the Base UI base: `button`, `sheet`, `dialog`, `accordion`, `select`, `input`,
  `textarea`, `checkbox`, `label` in `src/components/ui/`. Regenerate with the CLI; never edit by hand.
- Brand tokens from `design/tokens.css` pasted verbatim into `src/app/globals.css`, plus
  `.container-site`, `.section-y`, `.eyebrow`, `.hairline`, `.dark-wash`, `.hero-gradient-text`
  and the `.type-*` scale utilities. Every shadcn semantic colour is aliased onto a brand token,
  so a primitive cannot introduce an off-brand colour.
- Fonts self-hosted from `@fontsource-variable/montserrat` and `@fontsource/bebas-neue` through
  `next/font/local` (`src/lib/fonts.ts`). No `next/font/google`, no runtime request to Google.
- Content layer: `src/lib/content.ts` (typed accessors), `src/lib/format.ts` (fee, duration,
  date in Asia/Kolkata, WhatsApp URL builder), `src/lib/env.ts` (zod, every variable optional).
- `tests/routes.json` lists all 26 indexable routes plus the non-indexed component gallery.
- ESLint with the full `jsx-a11y` recommended set raised to error; Prettier with the Tailwind
  class sorter.

### Phase 1: foundation components

- `src/components/site/`, `course/`, `sections/` and `forms/` built, with a gallery at
  `/dev/components` (noindex) rendering every component in its default, empty, loading, error and
  TBC states.
- Design review run at 390 and 1280. Screenshots in `docs/screens/`. Score before fixes: 5/10.
  Every critical and high finding is fixed:
  - **The class merger was deleting colour classes.** `cn` read this project's `text-body` and
    `text-small` tokens as colours, so it dropped the `text-white` next to them: every WhatsApp
    button rendered black-on-black (1:1) and every red pill black-on-red (2.47:1). Fixed in
    `src/lib/cn.ts` by registering the custom theme scales, and aliased in `next.config.ts` so the
    shadcn primitives get the corrected merger without being hand-edited.
  - **237px of horizontal overflow at 390** from the three-rung level ladder. It now stacks below md.
  - **Tables pushed the document 209px wide at 390.** The screen-reader-only text inside them is
    absolutely positioned and escaped the scroll container. New `.table-scroll` utility.
  - Focus ring was invisible on the black grounds (blue on black is 1.26:1); it is white there now.
  - `outline-none` on the waitlist inputs removed the focus ring entirely.
  - Footer TBC pills rendered white-on-white-2; footer links were 18px tall, now 44px.
  - The sticky bar covered the footer legal row.
  - Bebas numerals were rendering at 20px, below the 24px floor.
  - Disabled primary buttons read as a selected chip; they are now grey.
- Verified: no route overflows at 390 (`node scripts/check-overflow.mjs`).

### Phase 2: layout, home, error pages

- Root layout: skip link, header, main, footer, sticky bar, consent banner, site-wide
  `EducationalOrganization` + `LocalBusiness` + `WebSite` JSON-LD, metadata defaults, `#FEFCFF`
  theme colour.
- Homepage in the specified order, with the red gradient used on the H1 and nowhere else.
- `not-found.tsx`, `error.tsx` and `/thank-you` (noindex), all three linking to the courses and
  to WhatsApp.

### Phase 3: courses hub, course pages, calendar

- `/courses` with server-rendered `?level=` and `?area=` filtering, canonical always `/courses`.
- `/courses/[slug]` for all 8 courses, each with `Course` + `BreadcrumbList` + `FAQPage` JSON-LD
  and its own Open Graph image route.
- `/calendar`, which currently renders the "dates being finalised" state with a per-course batch
  alert, because no instance in `content/data.ts` carries a date.

---

## TBC for client

Everything below renders as a visible "TBC" state on the site today. Send the value and it
appears; no code change is needed.

### Needs client

| # | Item | Where it shows | Source of the gap |
|---|---|---|---|
| 1 | Fee incl. GST for all 8 courses | Course cards, spec strips, fee blocks, fee table on `/courses` | `courses[].feeInclGst` is `null` |
| 2 | Duration (days and/or hours) for all 8 courses | Spec strips, course cards | `courses[].durationDays` / `durationHours` |
| 3 | Delivery format for all 8 courses | Spec strips | `courses[].format` |
| 4 | Batch dates | `/calendar`, batch tables, "next batch" strips | every `instances[]` entry is a `tbc` instance |
| 5 | Seat counts per batch | Batch tables | `instances[].seatsAvailable` |
| 6 | Syllabus / module list per course | "What you will learn" | `courses[].modules` is `null` |
| 7 | What the fee includes | "What you get" | `courses[].includes` is `null` |
| 8 | EMI availability | Fee block | `courses[].emiAvailable` |
| 9 | Which trainer teaches which course | Course pages, trainer profiles | `courses[].trainers` is empty for 7 of 8 |
| 10 | WhatsApp number | Every WhatsApp button, sticky bar | `siteSettings.whatsappConfirmed: false`; currently using +91 94481 06100 |
| 11 | Public email address | Footer, `/contact` | `siteSettings.email` is `null` |
| 12 | Opening hours | Footer, `/contact` | `siteSettings.hours` is `null` |
| 13 | Reply promise wording | `/enquire` trust line | `siteSettings.replyPromise` is `null` |
| 14 | Trainer roles and philosophy quotes | Trainer cards and profiles | `trainers[].role` / `philosophy` are `null` |
| 15 | Photos for every slot in `docs/images-manifest.md` | Hero, course cards, trainer profiles, about gallery, contact | no files in `public/images/` |
| 16 | Testimonials with written permission | Student stories section | `stories` is empty and stays empty until then |
| 17 | Legal copy: privacy, terms, refund policy | `/privacy`, `/terms`, `/refund-policy` | placeholder text marked `data-placeholder="true"` |
| 18 | Logo as SVG | Header, footer, OG images | only raster renders in `public/logo/` |
| 19 | Gotham web licence | Site-wide type | Montserrat is the interim substitute |
| 20 | Correct "Forest Green" hex | Seat-availability state | brochure prints `#89392B`, which is a brown |
| 21 | Correct plot number and map pin | `/contact`, footer, JSON-LD | site says Plot No. 72, brochure says 9; map pin points at "Siddarth Plaza" |
| 22 | SCA campus status and trainer AST status | Certification pages, course copy | until confirmed the site says "training aligned to the SCA Coffee Skills Program" |
| 23 | Written permission for the "Official Partner" wording | Header, footer, about, home | `facts.md` allows the wording provisionally |
| 24 | Which brochure claims are current | About, home | "17 branches", "Berry Co", "Coorg planters" are all unverified and unused |
| 25 | Legal entity name and tagline | Footer legal row | `siteSettings.legalName` / `tagline` are `null` |

### Needs developer (later phases, not this draft)

- Sanity migration: `content/data.ts` maps 1:1 to the future schema.
- Resend sending domain and DNS, so enquiries email instead of handing off to WhatsApp.
- Google Sheet lead log and auto-reply.
- GTM / GA4 / Clarity behind the consent banner (the `data-event` attributes are already in place).
- Cloudflare Turnstile on the enquiry form.
- Razorpay payment pages per batch (`instances[].paymentPageUrl`).
- Cal.com for campus visits.
- The eight SEO guides.

---

## Decisions taken

| Decision | Why |
|---|---|
| Scaffolded into a scratch directory and copied the generated files in | `create-next-app` refuses a non-empty directory and the kit files had to survive untouched. |
| shadcn primitives are used for behaviour only; every brand button, card and form control is a separate component | The generated `Button` is 32px tall by default, well under the 44/48px target rule, and its variants speak shadcn's semantic palette rather than the brand's. |
| The `dark` variant is bound to an explicit `.dark` class that the site never sets | shadcn primitives ship `dark:` classes; left on the OS preference they would fire on a viewer's dark-mode setting and break the white-dominant brand. |
| Fonts go through `next/font/local` rather than a plain `@font-face` | Still self-hosted and still Montserrat + Bebas Neue, but Next fingerprints the files, emits the preload link and generates a metric-matched fallback, which protects the CLS budget. |
| Desktop type sizes added as `--text-*-lg` tokens | `design/tokens.css` states the desktop scale in a trailing comment rather than as tokens; promoting it keeps the scale in one place instead of scattering `md:` sizes through components. |
| `.env.local` and the `.DS_Store` files were removed from git tracking | `.claude/rules/git.md` forbids committing `.env.local`; the files held no secrets, only the empty template. `.env.example` is force-included so it stays committed. |
| Node 24 used rather than the Node 22 in `.node-version` | That is what is installed on the build machine and Next 16 supports it. |
| **The header uses the standalone mark plus the academy name set in Montserrat, not the supplied lockup. Needs client sign-off.** | design.md assumes a horizontal lockup exists. The only supplied lockup is stacked and roughly square: at a header-sized 48px its wordmark renders about 5.6px tall and "INDIA" about 3.2px, so the academy's name is illegible on mobile and desktop alike. Reaching a readable 9px wordmark would need a 78px logo and a 95px header. The supplied artwork is untouched (no crop, recolour or rotation) and the full stacked lockup still runs in the footer, where 80px gives the wordmark room. This composes a new lockup, which is a brand decision, so it is flagged here rather than shipped quietly. Sending the SVG (item 18) or a horizontal lockup resolves it. |
| The enquiry form uses a native `<select>` rather than the shadcn/Base UI `Select` | The form is the site's only conversion path on a 64%-mobile audience. A native select opens the OS picker, needs no JavaScript, and cannot break. The shadcn `Select` is installed and demonstrated in the component gallery. |
| Course filters are links, not buttons | Every filtered view is rendered on the server, so it works with JavaScript off, reads correctly without ARIA, never flashes an unfiltered list, and canonicalises back to `/courses`. |
| `@fontsource/montserrat` added as a dependency | The Open Graph image renderer needs WOFF, and the variable package ships only WOFF2. Used at build time only; nothing extra reaches the browser. |
| The course-page title drops seo.md's `{Course} \| {Level} Barista Course in Bengaluru` pattern | That pattern runs to 73 characters for most of these course names, well past the 50 to 60 ceiling in the same rule. The ceiling wins, because it is what a search result actually displays; the longest variant of the pattern that fits is used. |

---

## Known limitations

- **The logo raster's red samples as `#AA1916`, not the `#B20003` token.** Visible where the mark
  sits beside a red button. This is the supplied artwork, and design.md forbids recolouring it, so
  nothing is done in code. The SVG (client item 18) resolves it.
- **Badge colours no longer identify a level uniquely.** `levelBadge` in `content/data.ts` gives
  mustard to both Foundation and IBC Junior, and blue to both Intermediate and IBC Advanced. The
  ladder's group headings carry the distinction. Worth a client decision if the badges are meant
  to be read on their own.
- **Context7 MCP is unavailable.** `CONTEXT7_API_KEY` is empty in `.env.local`, so every
  `create-next-app`, shadcn, Tailwind and Next API used here was verified against each tool's own
  `--help` output and its installed package instead. If a newer API exists, this is where it would
  have been caught.
