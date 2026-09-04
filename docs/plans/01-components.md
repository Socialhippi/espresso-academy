# Phase 1: foundation components

## What this phase builds

Everything the pages are assembled from, plus a gallery at `/dev/components` that renders each
component in each state so the design reviewer has one route to look at.

### `src/components/site/`
| Component | Client? | Notes |
|---|---|---|
| `Container` | no | `.container-site`: 1200px, 20/32px gutters |
| `Button` / `ButtonLink` | no | Brand pill. Separate from `ui/button.tsx`, which is 32px tall and speaks shadcn's palette |
| `SectionHeading` | no | Hairline, numbered red eyebrow, H2/H3, optional action. `onDark` inverts the eyebrow |
| `Header` | no | Logo, six nav items, WhatsApp icon, Enquire pill, mobile sheet trigger |
| `NavLink` | **yes** | Needs `usePathname` for `aria-current` |
| `MobileNav` | **yes** | Sheet: 48px rows, Call + Enquire, address, hours |
| `StickyBar` | **yes** | Scroll position and route. Mobile only, after 300px, hidden on `/enquire` and `/thank-you` |
| `Footer` | no | Black ground, four columns, legal row |
| `Breadcrumbs` | no | Visible trail + BreadcrumbList JSON-LD |
| `SkipLink` | no | First focusable element in the DOM |
| `Placeholder` | no | Branded geometry + mark at 20% + slot label. `role="img"` |
| `TbcPill` / `TbcValue` | no | The one honest stand-in for a missing value |
| `LevelBadge` | no | The only place mustard, blue and purple appear |
| `Logo` / `LogoMark` | no | Raster lockups until the SVG arrives |
| `WhatsAppButton` / `CallButton` | no | `data-event` attributes ready for the analytics phase |
| `WhatsAppGlyph` / `InstagramGlyph` | no | lucide dropped its brand icons |
| `ConsentBanner` | **yes** | Cookie via `useSyncExternalStore`, not an effect |
| `JsonLd` | no | Escaped `<script type="application/ld+json">` |

### `src/components/course/`
`CourseCard`, `SpecStrip`, `LevelLadder`, `BatchTable`, `WaitlistInline` (client),
`FeeBlock`, `CourseFilters` (client, URL-synced).

### `src/components/sections/`
`HomeHero` and `PageHero`, `ProofStrip`, `AudienceDoors`, `NextBatches`, `TrainerCard` and
`TrainerGrid`, `StoryGrid`, `FaqAccordion`, `FinalCta`.

### `src/components/forms/`
`Field` and `FieldError`, `EnquiryForm` (student | waitlist | cafe).

## Order

site primitives -> course components -> section components -> forms -> root layout ->
`/dev/components` -> design review -> apply critical and high fixes -> re-review.

## Decisions inside this phase

- **Full-card links.** Cards are one `<a>` wrapping the content, per `a11y.md`. No `div` with an
  `onClick`, no nested interactive elements.
- **The level badge sits under the photo, not on it.** `design.md` says "level badge top-left" but
  the master prompt's override says text never sits on top of an image. The override wins.
- **The enquiry form uses a native `<select>`.** The shadcn/Base UI `Select` is installed and shown
  in the gallery, but the form is the site's only conversion path on a 64%-mobile audience: a
  native select gets the OS picker, needs no JavaScript to open, and cannot break.
- **The honeypot is validated permissively and dropped in the route handler.** Rejecting it in the
  schema returns a 400 naming the field, which tells a bot exactly what it tripped.
