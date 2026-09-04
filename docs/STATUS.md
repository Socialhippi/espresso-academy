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

---

## Known limitations

- **Context7 MCP is unavailable.** `CONTEXT7_API_KEY` is empty in `.env.local`, so every
  `create-next-app`, shadcn, Tailwind and Next API used here was verified against each tool's own
  `--help` output and its installed package instead. If a newer API exists, this is where it would
  have been caught.
