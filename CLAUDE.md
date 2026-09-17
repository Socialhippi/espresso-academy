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
only, Motion for the few animations, lucide-react icons. pnpm. Node 22.

Integrations, each behind an env key and each degrading to a logged fallback when the key is absent:

- **Sanity** — content, bookings and enquiries. The Studio lives in `sanity/` and mounts at
  `/studio`. `content/data.ts` is the seed of record, not a runtime source; `src/lib/content.ts`
  reads GROQ.
- **Razorpay Checkout** — payments, test mode until launch. Adapter behind
  `src/lib/payments/provider.ts` so a second gateway can be added without touching a route.
- **Resend** — enquiry, auto-reply and booking-confirmation email. Without a key the enquiry form
  hands off to WhatsApp and the booking still completes.
- **Google Sheets** — lead mirror via a service account. Optional; a failure never fails a lead.
- **GTM / GA4** — behind consent mode v2, loaded lazily.
- **Meta Pixel + Conversions API** — browser and server, sharing one `event_id` for deduplication.
- **Cloudflare Turnstile** — on every public write route.

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
11. Amounts are never trusted from the client; the server reads the fee from Sanity when creating an order.
12. Every webhook verifies its signature and is idempotent.

## Plugins
The frontend-design plugin is installed: follow its craft guidance (hierarchy, type scale, restraint,
no generic AI aesthetics) but design/tokens.css and .claude/rules/design.md override any palette, font or
radius it suggests. The brand is the client's, not the plugin's.

StyleSeed (`ss-*` skills) is a separate, per-clone install, gitignored at `/.claude/skills/`:
`npx skills add bitjaru/styleseed`. Pinned to engine 4.2.0 (`sha256:2ac39abb2241`) on the `edge`
channel, so re-installs can drift — re-read its rules after an update. Same override order as above:
design/tokens.css and .claude/rules/design.md win. **Never run `/ss-setup` on this project** — it
picks colour, typography and density, and those came from the client's guidelines. Report any
StyleSeed rule that conflicts with design.md instead of applying it.

## Pushing
- `git config core.hooksPath .githooks` once per clone. `.githooks/pre-push` refuses a push from a
  detached HEAD or from a branch other than main.
- **Never `git push -q`.** Print the result, then print the remote tip and check it moved:
  `git push origin main && git rev-parse --short origin/main`. A quiet push that reports success
  can be a no-op: if HEAD is detached, local main has not moved either, so git is right to say
  "Everything up-to-date" while the work sits on no branch at all. Five commits were lost this way
  for an hour, and CI kept testing the stale tip.

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
