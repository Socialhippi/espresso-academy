# Start here (the simple version)

You already have Cursor, Git and Vercel set up. This is everything else, one action per step. Type exactly what is in the grey boxes. Total: about 20 minutes, then the computer works for 2 to 4 hours on its own.

## Part 1. Make the folder (3 minutes)

1. Open Cursor.
2. Click **File > Open Folder** and open (or create) an empty folder called `espresso-academy` somewhere like Documents.
3. Open the terminal inside Cursor: press **Ctrl + `** (the key under Esc). On Mac it is the same key.
4. Type this and press Enter. It turns the folder into a Git project:
   ```
   git init
   ```
5. Unzip `espresso-academy-kit.zip` and drag EVERYTHING inside it into the `espresso-academy` folder. Two of the items are hidden (`.claude` and `.mcp.json`). On Mac, press **Cmd + Shift + .** in Finder to show hidden files before dragging. On Windows, tick **View > Hidden items** in Explorer.
6. Check it worked. In the terminal type:
   ```
   ls -a
   ```
   You should see: `.claude`, `.mcp.json`, `CLAUDE.md`, `content`, `design`, `docs`, `public`, `README.md`, `.env.example`. If `.claude` is missing, go back to step 5.

## Part 2. Two small settings (3 minutes)

7. In Cursor's file list on the left, right-click `.env.example` and choose **Copy**, then **Paste**, then rename the copy to `.env.local`. (Or in the terminal: `cp .env.example .env.local`.)
8. Open `.env.local`. Fill in these two lines and save (Ctrl + S):
   - `CONTEXT7_API_KEY=` paste a free key from https://context7.com (sign up, copy key). This lets the AI read up-to-date docs so it does not write old code.
   - `LEAD_TO_EMAIL=` your email. (Enquiry emails will go here later. Leave `RESEND_API_KEY` empty for now; the form will hand people to WhatsApp instead.)
9. If you have the client's photos, put them in `public/images/` using the names in `docs/images-manifest.md`. If not, skip. Placeholders will show and you add photos later.

## Part 3. Install Claude Code and the plugins (8 minutes)

10. In the terminal, install Claude Code:
    ```
    npm install -g @anthropic-ai/claude-code
    ```
11. Install the TypeScript helper the code-intelligence plugin needs:
    ```
    npm install -g typescript typescript-language-server
    ```
12. Download the browsers the AI uses to look at the site:
    ```
    npx playwright install chromium webkit
    ```
13. Start Claude Code:
    ```
    claude
    ```
    The first time, it opens your browser to log in. Use your Claude Max account. Come back to the terminal.
14. If it asks "Do you trust the files in this folder?" choose **Yes**. If it asks to enable the MCP servers from `.mcp.json`, choose **Yes**.
15. Install the four plugins. Type each line inside Claude Code and press Enter. When a small box asks for a scope, choose **Project**.
    ```
    /plugin install frontend-design@claude-plugins-official
    ```
    ```
    /plugin install typescript-lsp@claude-plugins-official
    ```
    ```
    /plugin install code-review@claude-plugins-official
    ```
    ```
    /plugin install commit-commands@claude-plugins-official
    ```
    What they do: **frontend-design** is Anthropic's own plugin that stops Claude producing the generic "AI website" look. **typescript-lsp** shows Claude type errors the moment it makes them, so it fixes them instead of you. **code-review** reviews each phase for bugs. **commit-commands** writes clean commits. (`security-guidance` is already on by default and checks every change for security mistakes.)
16. Do NOT install the `playwright`, `context7` or `vercel` plugins. The kit already connects those three through `.mcp.json`; installing the plugins too would create duplicates.
17. Type this so the plugins switch on:
    ```
    /reload-plugins
    ```
18. Connect Vercel once. Type:
    ```
    /mcp
    ```
    Pick **vercel**, choose **Authenticate**, log in in the browser, come back. Press **Esc** to close the panel. If this fails, skip it; the AI will use the Vercel command line you already have.
19. Type `/exit` to leave Claude Code. Then save the kit to Git:
    ```
    git add -A
    ```
    ```
    git commit -m "chore: starter kit"
    ```

## Part 4. Press go (2 minutes)

20. Start Claude Code in the mode that does not keep asking "may I?":
    ```
    claude --permission-mode acceptEdits
    ```
21. In Cursor, open `docs/MASTER-PROMPT.md`. Select everything BELOW the horizontal line (`---`) to the end of the file. Copy it.
22. Click in the terminal, paste, press Enter.
23. Watch for 5 minutes. You should see it read the rules, write a plan, and create the Next.js project. If it asks a question, answer once (usually **Yes**). After that, leave the computer alone. Do not open Cursor's own AI chat on this folder while it runs.

## Part 5. When it stops (20 minutes)

24. The last message shows a **preview URL** and the contents of `docs/STATUS.md`. Open the URL on your phone.
25. Open `docs/review-script.md` and walk the ten steps yourself. Send one test enquiry.
26. Something looks wrong? Do not fix it by hand. Type one sentence in the same Claude Code window, for example:
    ```
    On /courses at 390px the filter chips overflow. Fix it, then run the design-reviewer on /courses.
    ```
27. Happy? Send the client the preview URL and the file `docs/CLIENT-REVIEW.md`. Ask them for ONE list of changes.

## Part 6. When the client sends real content (no coding)

28. Fees, dates, durations: open `content/data.ts`, find the course, replace `null` with the value (for example `feeInclGst: 25300`). Save. Then in Claude Code type: `Content updated in data.ts. Rebuild, run the qa-runner, and redeploy the preview.`
29. Photos: drop them into `public/images/` with the names from `docs/images-manifest.md`. Same redeploy sentence.
30. WhatsApp number, email, hours: edit `siteSettings` at the top of `content/data.ts`.
31. Anything the client says that is a new fact (their partner wording, SCA status, a real testimonial): add it to `content/facts.md` first, then tell Claude Code in one sentence what changed.

## If something breaks

- `claude: command not found` after step 10: close and reopen Cursor's terminal, try again. Still failing: run `npm bin -g`, add that folder to your PATH, reopen the terminal.
- `/plugin` says marketplace not found: type `/plugin marketplace add anthropics/claude-plugins-official` then repeat step 15.
- It keeps asking permission for `pnpm` or `npx`: make sure you started `claude` from inside the `espresso-academy` folder (step 20) and that `.claude/settings.json` exists.
- The Vercel deploy did not happen: in the terminal type `vercel` and press Enter on the defaults; it prints a URL.
- It invented a fee, date or testimonial: type `content/facts.md has no fee for that course. Revert to the TBC state and run the content-editor on that page.`
