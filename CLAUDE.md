# Espresso Academy India website

## What this is
Marketing and enrolment website for Espresso Academy India, a coffee education and barista
training academy in Bengaluru, Official Partner of Espresso Academy (Florence, since 2007).
Primary conversion: a qualified course enquiry (form + WhatsApp). Audience is ~64% mobile, India.
Client content (fees, dates, photos, testimonials) arrives later; the site must render cleanly with
those fields empty, showing a visible "TBC" state, never a fake value.

## Sources of truth (read before building anything)
- content/facts.md      the ONLY facts the site may state. Missing fact = TBC state + TODO comment.
- content/data.ts       typed content: courses, trainers, certifications, faqs, settings.
- design/tokens.css     the brand tokens. Paste into globals.css @theme. Never invent colours.
- docs/images-manifest.md  where photos go and how placeholders behave until they arrive.
- .claude/rules/*.md    path-scoped rules. Non-negotiable.

## Stack (fixed)
Next.js 16 App Router, TypeScript strict, Tailwind v4, shadcn/ui (Base UI default) for primitives
only, Motion for the few animations, lucide-react icons, Resend for the enquiry email (env key;
falls back to a WhatsApp handoff when the key is absent). pnpm. Node 22. No CMS in this phase:
content lives in content/data.ts with a shape that maps 1:1 to a future Sanity schema.

## Commands
pnpm dev            # http://localhost:3000
pnpm typecheck && pnpm lint
pnpm build          # must pass before every commit that touches src/
pnpm test:e2e       # playwright smoke (added in Phase 6 of the master prompt)

## Non-negotiables
1. No fact outside content/facts.md. No invented fees, dates, counts, partners, awards, reviews.
2. Mobile first: design at 390px, then 768, then 1280. Sticky bottom bar on mobile (WhatsApp, Call, Enquire).
3. Tokens only: no hex or arbitrary values outside globals.css. See .claude/rules/design.md.
4. Every route ships with metadata, canonical, Open Graph image, JSON-LD, and an entry in tests/routes.json.
5. Accessibility: WCAG 2.2 AA. No red text on black. 44px targets. Visible focus. Reduced motion respected.
6. Server Components by default; client components only for interaction, with a one-line reason comment.
7. Performance budgets: Lighthouse mobile >= 90 in this phase (>= 95 at launch), LCP <= 2.5s, CLS <= 0.05, initial JS <= 150KB gz.
8. No AI-generated people, campus or coffee imagery. Placeholders are branded geometric SVGs labelled "Photo: <slot>".
9. Do not edit src/components/ui/* by hand; regenerate via the shadcn CLI.
10. Commit after every phase with Conventional Commits. Never force-push.

## Plugins
The frontend-design plugin is installed: follow its craft guidance (hierarchy, type scale, restraint,
no generic AI aesthetics) but design/tokens.css and .claude/rules/design.md override any palette, font or
radius it suggests. The brand is the client's, not the plugin's.

## Working style
- Plan each phase in docs/plans/<phase>.md before writing code; keep executing without asking unless a
  non-negotiable would be violated.
- After every page: run the design-reviewer subagent, apply fixes scored high or critical, re-screenshot.
- When unsure about Next 16 / Tailwind 4 / shadcn Base UI APIs, query Context7 first.
- Keep a running docs/STATUS.md: what is done, what is TBC, what needs the client.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
