# Requirements

Everything needed to take this repo from a bare machine to a passing `pnpm build`.

**The npm packages are not listed here as versions.** `package.json` and `pnpm-lock.yaml` are the
source of truth and they are both committed; `pnpm install --frozen-lockfile` reproduces them
exactly. This file covers the layer _around_ the lockfile — the system tools, the logins and the
gitignored files — because none of that travels with a `git clone`, and a clone that skips it fails
in ways that look like code bugs.

---

## 1. System prerequisites

| Tool       | Version                                        | Why                                               | Install                                                            |
| ---------- | ---------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------ |
| Node       | **22** (`.node-version`; verified on v22.23.2) | Runtime                                           | `fnm install 22` / `nvm install 22`                                |
| pnpm       | **11.25.0** (pinned by `packageManager`)       | The only supported package manager                | `corepack enable` — it reads the pin and fetches the right version |
| Vercel CLI | 59.23.1                                        | `vercel env pull`, deploys, `vercel link`         | `pnpm add -g vercel`                                               |
| GitHub CLI | 2.100.0                                        | CI runs and repo secrets. Optional for local work | `brew install gh`                                                  |

`sanity` and `shadcn` are **project dependencies, not global installs**. Use `pnpm sanity …` and
`pnpm dlx shadcn@latest …`; a globally installed copy will drift from the one the lockfile pins.

Do not install pnpm with `npm i -g pnpm` if you can use corepack — corepack honours the
`packageManager` pin automatically, a global install does not.

---

## 2. Install sequence

```bash
git clone https://github.com/Socialhippi/espresso-academy.git
cd espresso-academy

corepack enable
pnpm install --frozen-lockfile

git config core.hooksPath .githooks      # once per clone — see RUNBOOK, "Setting up a clone"
pnpm exec playwright install chromium webkit
```

**If you copied the folder rather than cloning it, delete `node_modules` first.** pnpm's
`node_modules` is symlinks into `node_modules/.pnpm` plus hard links into the global store at
`~/Library/pnpm/store`. Copying it between machines either dereferences those links or leaves them
dangling:

```bash
rm -rf node_modules .next dist .sanity test-results .playwright-mcp tsconfig.tsbuildinfo
pnpm install --frozen-lockfile
```

Those paths are all gitignored build output and all regenerate. They are also ~2.8GB of the
folder's 3.3GB, so excluding them makes any transfer dramatically faster.

### Playwright browsers

`pnpm test:e2e` runs 932 tests across six projects. Their engines are **chromium** (Desktop Chrome,
Pixel 7, Laptop 1024) and **webkit** (Desktop Safari, iPhone 14, iPad Mini). Firefox is never used,
so `playwright install chromium webkit` is enough and skips a download you do not need. The browsers
live in `~/Library/Caches/ms-playwright`, outside the project — a fresh machine has none, and the
`design-reviewer`, `qa-runner` and `seo-auditor` subagents all fail without them.

---

## 3. What a clone does _not_ give you

Four gitignored things. The first cannot be regenerated from the repo at all.

| Path                          | Contents                                                                                          | How to restore                                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `.env.local`                  | 25 keys — Razorpay pair + webhook secret, Sanity read/write tokens, Resend, Turnstile             | `vercel env pull .env.local --environment=preview` (see below), or copy via a password manager. **Never over chat or email.** |
| `.claude/skills/`             | StyleSeed, 23 `ss-*` skills, pinned to engine 4.2.0 / `sha256:2ac39abb2241` on the `edge` channel | `npx skills add bitjaru/styleseed` — edge drifts, so re-read its rules after. **Never run `/ss-setup`.**                      |
| `.claude/settings.local.json` | MCP enable list and extra Bash permissions                                                        | Recreate from the block below                                                                                                 |
| `.vercel/`                    | Project link                                                                                      | `vercel link`                                                                                                                 |

`CLAUDE.md`, `.mcp.json`, `.claude/rules/`, `.claude/agents/` and `.githooks/` **are** tracked and
arrive with the clone.

### Pulling `.env.local` from Vercel

```bash
vercel login
vercel link                                          # .vercel/ is gitignored, so relink
vercel env pull .env.local --environment=preview
```

**`--environment` is not optional here.** The project has no Development environment — all 20
variables are Preview and/or Production — and `vercel env pull` defaults to Development. Without
the flag it writes a near-empty file and exits 0.

**Pull preview, never production.** Production is where live Razorpay keys go while Preview stays
on test keys (RUNBOOK, "switching from test keys to live keys", step 2). A production pull puts live
payment credentials in a local dev file, where a mis-click in checkout is a real charge.

The pulled file is more complete than a hand-carried one: it includes `RESEND_FROM_EMAIL`, which is
set on Vercel but absent from at least one local copy. Two things it will not contain:

- `TWENTYFIRST_API_KEY` — the `magic` MCP server. Re-add by hand only if you enable that server.
- `NEXT_PUBLIC_SITE_URL` — Production-only by design. Leave it unset; the build falls back to the
  deployment's own URL so canonicals describe themselves.

### Recreating `.claude/settings.local.json`

Gitignored because it is per-machine, but it holds no secrets. A known-good copy:

```json
{
  "permissions": {
    "allow": ["Bash(gh auth *)", "Bash(gh secret *)", "Bash(gh run *)", "Bash(grep -Ev \"^$\")"]
  },
  "enabledMcpjsonServers": ["playwright", "context7", "vercel", "shadcn"],
  "disabledMcpjsonServers": ["magic"],
  "enableAllProjectMcpServers": true
}
```

`magic` is disabled deliberately: its `TWENTYFIRST_API_KEY` is the one value in `.env.local` that is
not stored in Vercel, so a fresh clone cannot obtain it. Leave the server off, or regenerate a key
at 21st.dev. Never commit that key — `.gitleaks.toml` scans for exactly this.

### A clone is preferable to copying the folder

The working folder is ~3.3GB, of which `node_modules` (998MB), `.next` (1.8GB) and
`.playwright-mcp` (46MB) are regenerable build output. Transfers of that size fail often, and they
carry a `node_modules` that will not work on the far machine anyway. Clone instead, and let every
section above reconstruct the rest.

Budget for the clone: `.git` is ~412MB, because `docs/screens` is 49MB of tracked PNGs that have
been recommitted across design passes. `git clone --depth 1` avoids that history if you only need
to work, at the cost of `git log` and `git bisect`.

### Claude Code plugins and skills

Installed at user level in `~/.claude`, so neither a clone nor a folder copy carries them. Four
plugins, all from the official marketplace, and three of them scoped to this project's **absolute
path** — a clone at a different path will not pick them up even on the same machine.

```
/plugin marketplace add anthropics/claude-plugins-official
/plugin install frontend-design@claude-plugins-official
/plugin install typescript-lsp@claude-plugins-official
/plugin install code-review@claude-plugins-official
/plugin install commit-commands@claude-plugins-official
```

`frontend-design` is not optional: CLAUDE.md delegates craft guidance to it, subject to
design/tokens.css and .claude/rules/design.md overriding any palette, font or radius it suggests.

Do not copy `~/.claude` wholesale — it is 1.6GB, of which `~/.claude/skills` alone is 1.3GB. Install
what you use. The four agents this project relies on (`content-editor`, `design-reviewer`,
`qa-runner`, `seo-auditor`) live in `.claude/agents/` and **are** tracked, so they arrive with the
clone.

### Logins

Three, all stored in your home directory, none in the project:

```bash
gh auth login
vercel login
pnpm exec sanity login     # every pnpm sanity:* script runs --with-user-token
```

Sanity content lives in their cloud, so datasets follow the login — nothing to copy.

### Claude Code session state

Keyed off the absolute path, at
`~/.claude/projects/-Users-<you>-Downloads-espresso-academy/`. Put the repo at the same path on a
second machine to keep history, or accept starting fresh.

---

## 4. Direct dependencies, and what each is for

Orientation only. `package.json` is authoritative for versions.

**Framework** — `next` 16.3.4 · `react` / `react-dom` 19.2.8 (exact, not ranged)

**UI** — `@base-ui/react` (the base shadcn/ui generates against) · `lucide-react` ·
`tw-animate-css` · `tailwind-merge`, `clsx`, `class-variance-authority`, `cn`

> `cn` is aliased in `next.config.ts` to `src/lib/cn.ts` so the merger knows this project's theme.
> Without the alias it reads `text-body` as a colour and strips the `text-white` beside it. See the
> README's warning about `src/components/ui/*`.

**Fonts, self-hosted** — `@fontsource/bebas-neue` · `@fontsource-variable/montserrat` ·
`@fontsource/montserrat`

**CMS** — `sanity` · `next-sanity` · `@sanity/vision` · `@sanity/icons` · `@sanity/image-url` ·
`@portabletext/react` · `styled-components` (a hard requirement of Sanity Studio, not a styling
choice for the site)

**Integrations** — `razorpay` · `resend` · `zod`

**Tooling (dev)** — `typescript` · `eslint` + `eslint-config-next` + `eslint-plugin-jsx-a11y` ·
`prettier` + `prettier-plugin-tailwindcss` · `tailwindcss` + `@tailwindcss/postcss` ·
`@playwright/test` + `@axe-core/playwright` · `@sanity/client` · `shadcn` · `@types/*`

---

## 5. Verify the setup

```bash
git config core.hooksPath      # must print .githooks
pnpm typecheck
pnpm build                     # the gate before any commit touching src/
pnpm test:e2e
```

`git config core.hooksPath` printing nothing is the dangerous failure: the push gate is a local
hook, not a GitHub rule, so an unconfigured clone pushes straight to production unchecked.

Three checks sit outside the Playwright run and each needs a server on port 3000:

```bash
node scripts/check-overflow.mjs
node scripts/check-brand-contrast.mjs
node scripts/check-target-size.mjs
```
