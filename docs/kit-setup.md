<!-- Build 1's operator guide: how the agent that built this site was run. Kept because it
     documents the machine setup, and moved out of RUNBOOK.md, which is now the operational
     runbook for the live site. -->

# Step-by-step: from the kit to a client preview

Total hands-on time: about 15 minutes before the run, 20 minutes after. The run itself takes 2 to 4 hours unattended.

## Part A. One-time setup (skip any step already done)

1. Install Node 22 and pnpm.
   - macOS: `brew install node@22 pnpm` (or use nvm: `nvm install 22 && nvm use 22`, then `npm i -g pnpm`).
   - Windows: install Node 22 from nodejs.org, then `npm i -g pnpm`.
   - Check: `node -v` prints v22.x; `pnpm -v` prints a version.
2. Install Claude Code: `npm i -g @anthropic-ai/claude-code`. Check: `claude --version`.
3. Log in to Claude Code with your Max account: run `claude` once in any folder, follow the browser login, then type `/exit`.
4. Install Git if missing (`git --version`). Set your name and email: `git config --global user.name "Ashrith"` and `git config --global user.email "ashrith@socialhippi.com"`.
5. Install Cursor if missing. No Cursor-specific configuration is needed; Cursor is only the editor and terminal.
6. Vercel: `npm i -g vercel` then `vercel login` once (browser login). This lets the agent deploy the preview under your account.
7. Context7 key: sign up at context7.com, copy the free API key. This gives the agent current Next 16 and Tailwind 4 docs.
8. Playwright browsers: `npx playwright install chromium webkit` (takes a few minutes; the agent needs them for screenshots and tests).

## Part B. Prepare the repo (5 minutes)

9. Create the folder and repo:
   ```
   mkdir espresso-academy && cd espresso-academy && git init
   ```
10. Unzip `espresso-academy-kit.zip` INTO this folder so that `CLAUDE.md` sits at the root and the hidden `.claude/` folder and `.mcp.json` are present. Check:
    ```
    ls -la
    ```
    You should see `.claude`, `.mcp.json`, `CLAUDE.md`, `content`, `design`, `docs`, `public`, `README.md`, `.env.example`.
11. Create the env file:
    ```
    cp .env.example .env.local
    ```
    Open `.env.local` and fill:
    - `CONTEXT7_API_KEY=` your key from step 7.
    - `LEAD_TO_EMAIL=` your email (optional; without it the form hands off to WhatsApp).
    - `RESEND_API_KEY=` only if you have one (optional for the draft).
    - Leave `NEXT_PUBLIC_SITE_URL` as is.
12. Photos, if you have them: copy the shoot files into `public/images/` using the exact names in `docs/images-manifest.md` (for example `public/images/hero.jpg`, `public/images/trainers/akanksha-gupta.jpg`). If you do not have them yet, skip this; the site renders branded placeholders and you add the photos later without touching code.
13. First commit:
    ```
    git add -A && git commit -m "chore: starter kit"
    ```

## Part C. Run the agent (2 minutes of typing, then leave it)

14. Open the folder in Cursor: `cursor .` (or File > Open Folder).
15. Open Cursor's terminal (Ctrl+` or View > Terminal). Confirm you are in the repo root (`pwd` shows `.../espresso-academy`).
16. Start Claude Code in the mode that does not stop for routine permissions:
    ```
    claude --permission-mode acceptEdits
    ```
    The allow-list in `.claude/settings.json` covers pnpm, npx, git and the MCPs. If it asks about the MCP servers on first start, approve them.
17. Log in to the Vercel MCP once when asked: type `/mcp` in Claude Code, choose vercel, complete the browser login. (If you skip this, the agent falls back to the Vercel CLI, which you logged into in step 6.)
18. Open `docs/MASTER-PROMPT.md`, copy everything below the horizontal line, paste it into Claude Code as one message, press Enter.
19. Watch the first five minutes. You should see it read the rules, write `docs/plans/00-scaffold.md`, and run `create-next-app`. If it stops to ask anything, answer once (usually "yes") and it continues. After that, leave it.

## Part D. While it runs

20. Do not open Cursor's own AI agent (Composer/Agent) on this repo; one agent at a time.
21. Do not edit files in the repo while it runs. If you must add photos mid-run, drop them into `public/images/` only; nothing else.
22. Chase the client for the five inputs that turn TBC into real content: course list with fees and dates, WhatsApp number and hours, "Official Partner" wording confirmation, logo SVG, testimonials with permission.

## Part E. When it finishes (20 minutes)

23. Read the final message: it prints the preview URL and `docs/STATUS.md`. If a phase is listed under Known limitations, that is what to fix first.
24. Open the preview URL on your phone. Walk `docs/review-script.md` yourself before the client does. Submit one test enquiry.
25. If something is wrong, do not fix it by hand. In the same Claude Code session type a scoped instruction, for example: "On /courses at 390px the filter chips overflow. Fix and re-run the design-reviewer on /courses." Commit when done (`git add -A && git commit -m "fix(courses): chips overflow"`).
26. If the deploy did not happen, run `vercel` in the terminal, accept the defaults, and use the URL it prints. For a password-protected preview, enable Deployment Protection in the Vercel project settings (Pro plan).
27. Send the client the preview URL and `docs/CLIENT-REVIEW.md`. Ask for one consolidated list of changes from one decision-maker.

## Part F. Adding the client's content later (no code)

28. Fees, durations, dates, seats: edit `content/data.ts`. Replace `null` with values, for example `feeInclGst: 25300`, `durationDays: 3`, and in `instances` replace the tbc instance with `{ id: "sca-foundation-2026-10", startDate: "2026-10-12", endDate: "2026-10-14", schedule: "10am to 5pm", seatsAvailable: 8, status: "open", paymentPageUrl: null }`. Save, commit, push or run `vercel`. TBC pills disappear automatically.
29. WhatsApp number, email, hours, reply promise: edit `siteSettings` in `content/data.ts`.
30. Photos: drop files into `public/images/` per the manifest. Placeholders disappear.
31. Testimonials: add entries to `stories` in `content/data.ts` with `permission: true`. The stories section switches from its empty state.
32. New facts (partner wording, SCA status, brochure claims): add the line to `content/facts.md` first, then ask the agent to update the copy: "facts.md now confirms AST status for Akanksha Gupta; update the SCA wording site-wide per content.md."
33. Logo SVG: place `public/logo/lockup-on-white.svg`, `lockup-on-black.svg`, `mark.svg` and ask the agent: "Switch the Logo component to the SVG files."

## Part G. Troubleshooting

- `claude: command not found`: the npm global bin is not on PATH. Run `npm bin -g` and add that folder to PATH, or reinstall with `npm i -g @anthropic-ai/claude-code`.
- Claude Code keeps asking permission for pnpm or npx: confirm `.claude/settings.json` is in the repo root and you started `claude` from the root.
- MCP "playwright" fails to start: run `npx @playwright/mcp@latest --help` once to fetch it, then restart Claude Code.
- `create-next-app` refuses because the folder is not empty: tell the agent "scaffold into a temp folder and move src, package files and config into the root without overwriting the kit files"; the prompt already covers this but some versions insist.
- Build fails on fonts: the agent should use `@fontsource/bebas-neue` and `@fontsource-variable/montserrat`; if it used next/font/google and your network blocks Google, say "switch to the fontsource packages per the prompt."
- Vercel deploy asks for a scope: pick your personal account or team; the project name is `espresso-academy-india`.
- Lighthouse below 90: ask "run /perf phase again on the failing route and explain the top three causes from the Lighthouse JSON."
- The agent invented a fee or a date: this is the one thing to treat as a bug. Say "content/facts.md has no fee for X; revert to the TBC state and run content-editor on that page." Then check `docs/STATUS.md` lists it.

## Part H. After client approval (the next run)

The strategy document in the project covers this. In short, the next prompts add Sanity (content/data.ts migrates 1:1), the Google Sheet lead log and auto-reply, GTM/GA4/Clarity, Turnstile, Razorpay Payment Pages, Cal.com, the eight guides, full QA and the launch cutover. Roughly eight working days.
