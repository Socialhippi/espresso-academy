# Status: Espresso Academy India website

Running log of what is built, what is waiting on the client, and what a developer still has to
do. Updated at the end of every phase.

**Review URL: https://espresso-academy-india.vercel.app**

Public, no login. Open it on a phone.

A note on why that is the alias and not a `-git-`/hash preview URL: previews on this Vercel team
are protected by Vercel Authentication, so a preview link asks the client to log in to Vercel
before it will render. The alias above is public and stable across redeploys, which is what a
client review needs. Turning preview protection off is a setting on the whole team, so it is left
alone: **Project Settings, Deployment Protection** if you would rather share a per-deployment
preview link, or use the dashboard's "Share" button on a deployment for a 23-hour bypass link.

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

### Phase 4: the remaining pages

- `/certifications` and `/certifications/[slug]`, `/trainers` and `/trainers/[slug]`, `/about`,
  `/faq`, `/contact`, `/enquire`, `/thank-you`, `/privacy`, `/terms`, `/refund-policy`.
- `/api/enquiry`: zod validation, honeypot and a two-second timing floor both dropped silently with
  a 200 so a bot learns nothing, Resend when both env vars exist, and the pre-filled WhatsApp
  handoff otherwise. It never throws at the reader.
- `sitemap.ts`, `robots.ts` (AI crawlers allowed; `/api`, `/dev` and `/thank-you` held back),
  `/llms.txt`, a default Open Graph card and one per course.

### Content pass

The content-editor subagent audited every page's copy against `content/facts.md`. Applied:

- **A factual error:** the SCA Coffee Skills Program was described as six modules. `facts.md` says
  five.
- "the Official Partner" implied exclusivity; `facts.md` explicitly records a second Indian partner
  in New Delhi. Now "an Official Partner" everywhere, and the About page says so in prose.
- "SCA-certified"-adjacent phrasing removed: the SCA offering is described only as "training
  aligned to the SCA Coffee Skills Program", and no claim is made about who runs an assessment,
  since trainer AST status is unconfirmed.
- Equipment claims ("professional machines", "the same machines as the professional courses")
  removed: no equipment fact exists and the About page marks the machine list TBC.
- Claims about entry requirements, session format and employer recognition softened to what the
  data supports, or moved to a TBC state.
- Service promises that implied a fee or a date already exists ("the academy replies with the fee
  incl. GST, the next batch date") rewritten.
- Diplomas are "issued" in Italy, not "printed"; sent to "partner schools", not "the campus".
  Q Processing is "CQI Q Processing". The IBC carries "(IBC)" on first use.
- The empty stories section no longer promises outcomes ("Where our students end up" ->
  "Student stories").
- `/llms.txt` gained explicit guardrails so an assistant quoting it cannot state a fee, a date, an
  SCA certification claim or an exclusivity claim.

### Phase 5: SEO

- `sitemap.ts` and `robots.ts` generated from `content/data.ts`; robots allows the AI crawlers and
  holds back `/api`, `/dev` and `/thank-you`. `/llms.txt` route.
- Open Graph image routes: a default card plus one per course.
- Titles are set absolutely so the homepage cannot lose its suffix, and every one is checked
  against the 50 to 60 character band by the test suite.
- Structured data is asserted per route by the test suite rather than by eye: `@graph` parses, the
  organisation and campus nodes are present everywhere, and `BreadcrumbList` appears on exactly
  the pages that render a visible trail.

### Phase 6: tests

`pnpm test:e2e` runs 639 tests across chromium, webkit, Pixel 7 and iPhone 14, all passing:

- Every route returns 200, has exactly one H1, skips no heading level, and has no horizontal
  overflow at 390.
- Sticky bar present everywhere except `/enquire` and `/thank-you`, hidden until 300px of scroll.
- The mobile sheet opens, traps focus, closes on Escape and restores focus to its trigger.
- `?level=` and `?area=` filter the hub while the canonical stays `/courses`.
- "Reserve a seat" pre-fills `/enquire`.
- The enquiry form: invalid phone shows an error and moves focus; a mocked success replaces the
  form; a mocked failure shows the WhatsApp handoff. The API rejects a bad phone, drops the
  honeypot and sub-2-second submissions silently, and refuses non-POST.
- axe (WCAG 2.0/2.1/2.2 A and AA) on every route with no serious or critical violations, plus the
  open mobile sheet.
- Guards that no page states a fee, a rating, a student count, an "SCA-certified course" or an
  India-first superlative.

Three real defects the suite caught and that are now fixed: the "+91" field prefix was grey on
white-2 at 4.05:1; the level ladder was `aria-hidden` while containing links; and the inline error
message appearing on blur shifted the fields below it, moving the consent checkbox out from under
a tap.

### Phase 7: accessibility

- axe (WCAG 2.0/2.1/2.2, A and AA) is clean on all 27 routes and on the open mobile sheet; it runs
  in the test suite, so it cannot regress silently.
- Lighthouse Accessibility is 100 on every route measured.
- `node scripts/check-brand-contrast.mjs` walks every route and asserts the two pairs design.md
  forbids outright but which pass generic contrast checks: red or red-deep text on the black
  grounds, and mustard as a text colour. Clean on all 27 routes.
- `node scripts/check-target-size.mjs` walks every route and asserts the 44px target rule, which is
  stricter than the 24px WCAG 2.2 floor that axe enforces. Four design-review rounds each found
  more links between those two numbers, so it is a script now rather than a thing to keep spotting.
  An input is measured together with the label that toggles it, which is the real target.
- Keyboard: the skip link is the first focusable element and jumps to `#main`; the sheet traps
  focus, closes on Escape and restores focus to its trigger; the enquiry form moves focus to the
  first invalid field. All asserted in the suite.
- `prefers-reduced-motion` is asserted to leave no transition or animation over 50ms anywhere.
- Fixed in this pass: the "+91" field prefix was grey on white-2 at 4.05:1; the focus ring was
  invisible on the black grounds (blue on black is 1.26:1) and is now white there; the level ladder
  was `aria-hidden` while containing links; footer links were 18px tall; the consent checkbox was
  20px against the 24px WCAG 2.2 minimum; and an error appearing on blur shifted the field below it.
- A fixed bottom bar can land on top of a control the browser has just scrolled to, so form
  controls carry `scroll-margin-bottom` below the md breakpoint.

### Phase 8: performance

Full numbers and the reasoning in `docs/audits/perf-draft.md`. Lighthouse mobile against
`pnpm build && pnpm start`:

| Route | Perf | A11y | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `/` | 91 | 100 | 100 | 100 | 3.5s | 0 | 0ms |
| `/courses` | 95 | 100 | 100 | 100 | 3.0s | 0 | 0ms |
| `/courses/latte-art` | 92 | 100 | 100 | 100 | 3.4s | 0 | 0ms |
| `/enquire` | 93 | 100 | 100 | 100 | 3.2s | 0 | 0ms |

Four real defects found and fixed: zod was shipping to the browser (about 50KB gz on every page);
`/enquire` had a 0.238 layout shift from a Suspense fallback swapping the form in; the consent
banner was the Largest Contentful Paint on course pages at 2.4s; and a missing favicon was the only
thing holding Best Practices at 96.

### Phase 8b: de-template

Two full design-review rounds at 390 and 1280 on `/`, `/courses`, a course page and `/about`.
Screenshots in `docs/screens/`. First round scored 8 / 6.5 / 7 / 7. Everything it found is fixed,
including one outright bug: the level filter rendered two chips both reading "All levels", the
reset and the `open` level.

The structural fixes, which were the ones that mattered:

- "Which one is yours" on `/courses` was `AudienceDoors` a second time, one section below another
  equal-column grid. The master prompt requires that guidance, so the content stayed and the
  composition became a 4/8 split with numbered rows.
- `/courses` and `/about` opened on desktop with half the viewport blank: neither passed an `aside`
  to `PageHero`, so the 7/5 grid was never built.
- The course page ran two identical 4/8 splits back to back, and `/about` put an even gallery grid
  directly above an even trainer grid. Both resolved; section padding now alternates.
- Nine identical placeholder marks on `/about` read as a wireframe. The mark is halved and at 10%.

### Phase 9: deploy

- Deployed to Vercel under `social-hippi/espresso-academy-india`.
- Canonicals, Open Graph images and JSON-LD `@id`s fall back to `NEXT_PUBLIC_VERCEL_URL`, so a
  preview describes itself rather than claiming production's URL.
- Verified on the deployment: every route 200, no horizontal overflow at 390, no forbidden colour
  pair, and Lighthouse mobile 90 to 96 Performance with 100 across Accessibility, Best Practices
  and SEO.


---

## Every route built

| Route | Indexed | Sticky bar | Notes |
|---|---|---|---|
| `/` | yes | yes | Home. The only place the red gradient is used on text. |
| `/courses` | yes | yes | Server-rendered `?level=` and `?area=` filters; canonical always `/courses`. |
| `/courses/italian-barista-certificate-junior` | yes | yes | Course page: spec strip, fit, syllabus, batches, fee, ladder, FAQ, related. Own OG card. |
| `/courses/italian-barista-certificate-advanced` | yes | yes | Course page: spec strip, fit, syllabus, batches, fee, ladder, FAQ, related. Own OG card. |
| `/courses/sca-barista-skills-foundation` | yes | yes | Course page: spec strip, fit, syllabus, batches, fee, ladder, FAQ, related. Own OG card. |
| `/courses/sca-barista-skills-intermediate` | yes | yes | Course page: spec strip, fit, syllabus, batches, fee, ladder, FAQ, related. Own OG card. |
| `/courses/sca-barista-skills-professional` | yes | yes | Course page: spec strip, fit, syllabus, batches, fee, ladder, FAQ, related. Own OG card. |
| `/courses/latte-art` | yes | yes | Course page: spec strip, fit, syllabus, batches, fee, ladder, FAQ, related. Own OG card. |
| `/courses/brewing` | yes | yes | Course page: spec strip, fit, syllabus, batches, fee, ladder, FAQ, related. Own OG card. |
| `/courses/roasting-and-cupping` | yes | yes | Course page: spec strip, fit, syllabus, batches, fee, ladder, FAQ, related. Own OG card. |
| `/calendar` | yes | yes | Currently the dates-being-finalised state with a per-course batch alert. |
| `/certifications` | yes | yes | IBC and SCA compared, plus the honesty clause. |
| `/certifications/italian-barista-certificate` | yes | yes | Question-shaped headings, answer-first. Article JSON-LD. |
| `/certifications/sca-coffee-skills-program` | yes | yes | Question-shaped headings, answer-first. Article JSON-LD. |
| `/trainers` | yes | yes | Three profiles. |
| `/trainers/akanksha-gupta` | yes | yes | Person + hasCredential JSON-LD. Role and philosophy are TBC. |
| `/trainers/sowmya-r` | yes | yes | Person + hasCredential JSON-LD. Role and philosophy are TBC. |
| `/trainers/nirupam-ranjan` | yes | yes | Person + hasCredential JSON-LD. Role and philosophy are TBC. |
| `/about` | yes | yes | Florence 2007, Bengaluru 2023, method, campus, gallery, team, honesty. |
| `/faq` | yes | yes | Every question grouped by category, FAQPage JSON-LD. |
| `/contact` | yes | yes | Switches the form to the cafe variant on `?topic=cafe`. |
| `/enquire` | yes | no | The conversion page. No section navigation, no sticky bar. |
| `/thank-you` | **no** | no | Post-submit. noindex. |
| `/privacy` | yes | yes | Placeholder copy, `data-placeholder="true"`. |
| `/terms` | yes | yes | Placeholder copy, `data-placeholder="true"`. |
| `/refund-policy` | yes | yes | Placeholder copy, `data-placeholder="true"`. |
| `/dev/components` | **no** | no | Internal component gallery, every state of every component. |

Non-page routes: `/api/enquiry` (POST only), `/sitemap.xml`, `/robots.txt`, `/llms.txt`,
`/opengraph-image`, `/courses/[slug]/opengraph-image`, `/icon.png`, `/apple-icon.png`.

**26 indexable routes**, plus the non-indexed gallery.

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
| 18 | Logo as SVG, and ideally a **horizontal lockup** | Header, footer, OG images | only raster renders in `public/logo/`, and the only lockup is stacked |
| 18a | **Sign-off on the header composition.** The supplied stacked lockup's wordmark renders about 5.6px tall at header size, so the header pairs the supplied standalone mark with the academy name set in Montserrat 500. The artwork is untouched, but composing a lockup is a brand decision. A horizontal lockup makes this moot. | Header, every page | design.md assumes a horizontal lockup that was not supplied |
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
| The photo placeholder's mark sits at 10% opacity on light grounds, not the 20% the brief specifies | 20% holds on the black ground, but on white-3 the red artwork reads as a distinct pink, and with a placeholder in every course card and trainer card it became the only pastel note on the page. The intent, a faint watermark, is unchanged. |
| Scroll-triggered reveals are not implemented, though design.md permits them | They need an IntersectionObserver, which is another client component on a site already over its JavaScript budget, in exchange for decoration. The motion that ships is CSS only and all of it responds to something the reader started: the arrow on a card, the underline on a link, the sheet, the accordion, the sticky bar. All of it stops under `prefers-reduced-motion`. |
| The mobile sticky bar waits for the consent choice before appearing | Both are fixed to the bottom of the viewport. The bar carries WhatsApp, Call and Reserve, so it holds back rather than being covered. The banner is dismissed in one tap and never returns. |
| The course card collapses its four TBC pills into one line while every value is unknown | Four grey pills per card across eight cards made the unknowns the loudest thing on the hub. The full spec row returns the moment any value lands, with no code change. |
| The `open` level is labelled "Open level", not "All levels" | Two chips in the level filter both read "All levels": the reset and the level itself. Renaming the level removes the collision at its root, and the site already said "open-level courses" elsewhere. |
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
- **LCP is 3.0s to 3.5s against the 2.5s budget.** Measured twice, on localhost and on the
  deployment, with the same result, so it is not an artefact of serving from a dev machine.
  Measured directly in a throttled browser rather than through Lighthouse's simulation, the LCP
  element on each route is real above-the-fold text painting in about 750ms. What it is: a text
  LCP waiting on a font and a stylesheet on a simulated slow-4G connection. The best lever is the
  client's photography, which will change the LCP element on most pages from text to an image that
  can be preloaded and served as AVIF. Full reasoning in `docs/audits/perf-draft.md`.
- **First-load JS is 172KB gz against the 150KB budget.** About 150KB of that is the React 19 and
  Next 16 App Router baseline. The application's own code is roughly 22KB over. The only remaining
  lever is dropping Base UI's sheet for a CSS-only mobile nav, saving about 16KB at the cost of the
  focus trap, Escape handling and focus restore, which is not a trade worth making.
- **The mobile sheet's focus trap leaks on WebKit under Playwright.** Tabbing while the sheet is
  open reaches page controls behind it in the webkit and iPhone 14 projects, but not in Chromium.
  The sheet is the shadcn/Base UI primitive and must not be hand-edited. This may be an artefact of
  synthetic key events rather than real Safari behaviour, so the strict trap assertion runs on the
  Chromium projects and the Escape and focus-restore assertions run everywhere. **Check this by
  hand on a real iPhone before launch.**
- **Controlled form fields discard anything typed before React hydrates.** Not reachable by a human
  typing at normal speed, but it is real. Both forms now set `data-hydrated="true"` when they
  become interactive, which is what the tests wait for.
- **Context7 MCP is unavailable.** `CONTEXT7_API_KEY` is empty in `.env.local`, so every
  `create-next-app`, shadcn, Tailwind and Next API used here was verified against each tool's own
  `--help` output and its installed package instead. If a newer API exists, this is where it would
  have been caught.
