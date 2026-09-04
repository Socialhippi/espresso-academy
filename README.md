# Espresso Academy India website: starter kit

This folder is dropped into an EMPTY repo before the first Claude Code prompt. It contains the rules, agents, facts, content, tokens and the single master prompt. Nothing here is site code; the prompt builds the site.

## Steps (15 minutes of your time, then walk away)
1. `mkdir espresso-academy && cd espresso-academy && git init` then copy the contents of this kit into it (including the hidden `.claude/` folder and `.mcp.json`).
2. Put the client's photos into `public/images/` per `docs/images-manifest.md` if you have them. If not, skip; placeholders render.
3. Copy `.env.example` to `.env.local`. Fill `LEAD_TO_EMAIL` and `RESEND_API_KEY` if you want the form to email (optional for the draft). Fill `CONTEXT7_API_KEY` (free key from context7.com) so the agent reads current Next 16 / Tailwind 4 docs.
4. Make sure `pnpm`, Node 22 and Claude Code are installed, and `npx vercel login` has been run once so the preview deploy works. Run `claude mcp login vercel` once if prompted.
5. Open the folder in Cursor, open the terminal, run `claude --permission-mode acceptEdits`, and paste the prompt from `docs/MASTER-PROMPT.md` (everything below the line).
6. Come back in 2 to 4 hours. Read `docs/STATUS.md` and open the preview URL on your phone. Send the client `docs/CLIENT-REVIEW.md`.

## What you get
Every public page, the brand applied, verified facts only, TBC states for everything the client has not supplied, working enquiry form (email or WhatsApp handoff), metadata and structured data on every page, Playwright + axe tests, Lighthouse >= 90 mobile, a Vercel preview URL.

## What is deliberately not in the draft
Sanity CMS, Google Sheet lead log, GTM/GA4/Clarity, Turnstile, Razorpay, Cal.com, guides/blog, the reel. These follow client approval; see the execution strategy in the project.
