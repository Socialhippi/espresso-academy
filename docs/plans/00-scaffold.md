# Phase 0: plan and scaffold

## Route list

| Route | Type | Index | Notes |
|---|---|---|---|
| `/` | static | yes | Home. Only place the hero gradient H1 is allowed. |
| `/courses` | static | yes | Hub. `?level=` filter, canonical always `/courses`. |
| `/courses/[slug]` | SSG x8 | yes | `generateStaticParams` from `courses[]`. Own OG image route. |
| `/calendar` | static | yes | Month-grouped instances; empty state until dates arrive. |
| `/certifications` | static | yes | IBC vs SCA comparison hub. |
| `/certifications/[slug]` | SSG x2 | yes | `italian-barista-certificate`, `sca-coffee-skills-program`. |
| `/trainers` | static | yes | Grid of 3. |
| `/trainers/[slug]` | SSG x3 | yes | `akanksha-gupta`, `sowmya-r`, `nirupam-ranjan`. |
| `/about` | static | yes | Florence 2007, Bengaluru 2023, method, campus, team, honesty. |
| `/faq` | static | yes | All FAQs grouped by category, FAQPage JSON-LD. |
| `/contact` | static | yes | Address, phones, WhatsApp, `?topic=cafe` form variant. |
| `/enquire` | static | yes | Student enquiry form, pre-filled from `?course=` / `?batch=`. |
| `/thank-you` | static | **no** | Post-submit. No sticky bar. |
| `/privacy` | static | yes | `data-placeholder="true"`, TODO(client). |
| `/terms` | static | yes | `data-placeholder="true"`, TODO(client). |
| `/refund-policy` | static | yes | `data-placeholder="true"`, TODO(client). |
| `/dev/components` | static | **no** | Component gallery, `force-static`, robots noindex. |

Non-page routes: `/api/enquiry` (POST), `/sitemap.xml`, `/robots.txt`, `/llms.txt`,
`/opengraph-image` (default OG), `/courses/[slug]/opengraph-image`.

Total indexable HTML routes: 16 static + 13 generated = **29**.

## Component list

### `src/components/site/`
Container, SectionHeading, Header, MobileNav (client: Sheet), StickyBar (client: scroll),
Footer, Breadcrumbs, SkipLink, Placeholder, TbcPill, LevelBadge, WhatsAppButton, CallButton,
ConsentBanner (client: cookie), Logo, Prose, Hairline.

### `src/components/course/`
CourseCard, SpecStrip, LevelLadder, BatchTable, WaitlistInline (client: form), FeeBlock,
CourseFilters (client: URL sync).

### `src/components/sections/`
Hero, ProofStrip, AudienceDoors, NextBatches, TrainerCard, TrainerGrid, StoryGrid,
FaqAccordion (client: Accordion), FinalCta, DarkSection.

### `src/components/forms/`
EnquiryForm (client), FormField, FormError, ConsentField, SubmitButton, SuccessPanel,
WhatsAppFallback.

### `src/lib/`
`content.ts` (typed accessors), `format.ts` (fee/duration/date/whatsappUrl), `env.ts` (zod),
`seo/schema.ts` (@graph builders), `seo/metadata.ts` (title/description/canonical helpers),
`utils.ts` (cn).

## Build order

1. **Phase 0** scaffold, tokens into `globals.css`, content + format + env libs, routes.json, STATUS.md.
2. **Phase 1** site primitives -> course components -> section components -> forms -> `/dev/components` gallery -> design review.
3. **Phase 2** root layout + site-wide JSON-LD -> home -> error/not-found -> `/thank-you`.
4. **Phase 3** `/courses` -> `/courses/[slug]` (+ OG route) -> `/calendar`.
5. **Phase 4** certifications -> trainers -> about -> faq -> contact -> enquire -> `/api/enquiry` -> legal -> sitemap/robots/llms.txt/OG default.
6. **Phase 5** SEO audit and fixes. **Phase 6** Playwright. **Phase 7** a11y. **Phase 8/8b** perf + de-template. **Phase 9** deploy.

## Scaffold method

`create-next-app` refuses a non-empty directory, and this one already holds the kit
(`CLAUDE.md`, `.claude/`, `content/`, `design/`, `docs/`, `public/`, `.env.local`, `.mcp.json`).
So: scaffold into a scratch directory with
`--ts --tailwind --eslint --app --src-dir --use-pnpm --import-alias "@/*" --empty --disable-git --yes`,
then copy only the generated files that do not already exist in the repo root
(`package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`,
`next-env.d.ts`, `src/`), merging `public/` rather than replacing it.

## Decisions taken in this phase

- Context7 MCP has no API key in `.env.local`, so the Next 16 / Tailwind 4 / shadcn APIs are
  taken from each tool's own `--help` and the installed package's shipped docs instead.
- Node 24 is installed rather than the Node 22 in `.node-version`. Next 16 supports it; recorded
  as a decision rather than downgrading the machine.
