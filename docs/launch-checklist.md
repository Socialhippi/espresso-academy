# Launch checklist

Everything between the site as it stands and the site being live at espressoacademy.in. In order:
some of these depend on the ones above them.

Commands are in `docs/RUNBOOK.md`; this is the list, not the instructions.

---

## 1. Content the academy has to send

None of this blocks a deploy. Every item already renders a visible TBC state, and sending the value
makes it appear with no code change. But the site should not be *launched* with the first four
empty, because they are what a student came to find out.

- [ ] **Fee incl. GST for all 8 courses.** Until then no course is bookable and every card says
      "Fee: TBC".
- [ ] **Batch dates.** Until then the calendar shows "dates being finalised".
- [ ] **Duration** for each course.
- [ ] **Which trainer teaches which course.** Seven of eight courses have none assigned, and the
      Studio will not let an editor publish a course without one.
- [ ] A **fourth question** on each course. Same publish gate.
- [ ] **WhatsApp number confirmed** — the site currently uses +91 94481 06100 for both call and
      WhatsApp on the strength of the current website, which is not the same as confirmation.
- [ ] **Public email address** and **opening hours**.
- [ ] **Reply promise** wording, or leave it empty and the site promises no interval.
- [ ] **Legal entity name** for the footer.
- [ ] **Refund and reschedule policy.** The checkout links to it before anyone pays, so this is the
      one piece of legal copy that should not launch as a placeholder.
- [ ] **Photographs** for the slots in `docs/images-manifest.md`. Also the single biggest
      performance lever left: every page's largest element is text today.
- [ ] **Testimonials with written permission**, if any. The stories page stays empty until then, by
      design.
- [ ] **Privacy and terms** copy. Currently developer-written placeholders marked
      `data-placeholder="true"`.

`node scripts/stale-content.mjs` prints this list live from Sanity, so it cannot go stale.

---

## 2. Decisions the academy has to make

- [ ] **Written permission for "Official Partner of Espresso Academy, Florence".**
      `content/facts.md` allows it provisionally.
- [ ] **SCA campus status and trainer AST status.** Until confirmed the site says "training aligned
      to the SCA Coffee Skills Program" and never "SCA-certified".
- [ ] **Which brochure claims are current.** "17 branches", "Berry Co" and "Coorg planters" are
      unverified and unused.
- [ ] **Correct plot number and map pin.** The brochure and the current site disagree.
- [ ] **Logo as SVG**, ideally a horizontal lockup, and sign-off on the header composition.
- [ ] **Gotham web licence**, or Montserrat stays.
- [ ] **Correct "Forest Green" hex.** The brochure prints `#89392B`, which is a brown.
- [ ] **Payment gateway.** Razorpay is live and tested at 2% + GST. Cashfree is running 0% domestic
      to March 2027 and PhonePe a promotional 0%. At ₹25,000 a seat, 2% is ₹500 a booking. The
      adapter exists so a second gateway is one file, not four route handlers.

---

## 3. Accounts and keys

- [ ] **Resend sending domain. This one is not cosmetic and it is not optional.** Verify the
      academy's domain at resend.com/domains and set `RESEND_FROM_EMAIL` to an address on it.
      Until then mail goes from `onboarding@resend.dev`, and **Resend delivers that sender only to
      the Resend account owner's own address**. Every other recipient is rejected with a 403. In
      practice that means the academy's copy of a booking arrives and **the student's confirmation
      never does** — which is exactly what happened to the first real test booking. An earlier
      version of this line said it "reaches an inbox", and that sentence is why nobody checked.
- [ ] **Google Sheets lead mirror.** Create a service account, share the sheet with it, set
      `GOOGLE_SHEETS_ID`, `GOOGLE_SHEETS_CLIENT_EMAIL` and `GOOGLE_SHEETS_PRIVATE_KEY`. Optional:
      without it a lead still reaches Sanity and the inbox.
- [ ] **Meta Pixel and Conversions API.** Set `NEXT_PUBLIC_META_PIXEL_ID` and
      `META_CAPI_ACCESS_TOKEN`. Test with `META_TEST_EVENT_CODE` set, then **remove it**, or every
      real conversion is filed as a test.
- [ ] **Google Ads account**, if the academy wants one. Two paused conversion tags are waiting in
      the container with placeholder IDs.
- [ ] **Cal.com**, if the academy wants cafe enquiries to book a call. Set
      `NEXT_PUBLIC_CALCOM_LINK`.
- [ ] **Import the GTM container**: `docs/gtm-container.json`, per `docs/analytics-setup.md`.

---

## 3b. Production environment checks

Three outages in one day came from the same shape of mistake: a variable that is right on a
developer's machine and absent, or differently named, in production. None of them threw. Each one
rendered a working-looking site with one path that refused everybody. **Run these against the
deployment, not against localhost.**

- [ ] **Every variable the code reads is present in Vercel production.** The inventory is in
      `docs/STATUS.md` under "Environment on Vercel", by name, with what each absence does. Compare
      it against `vercel env ls production` and against `.env.example`; anything in the second and
      not the first is a silent degradation waiting to happen.
- [ ] **The boot log is clean.** `vercel logs <deployment-url> --since 1h | grep half-configured`
      returns nothing. `src/instrumentation.ts` prints the feature flags on every server boot and
      names any integration configured on one side only.
- [ ] **A real email leaves the building.** Make a test booking on the deployed URL with a student
      email that is **not** the Resend account owner's, and confirm the confirmation arrives.
      Check `https://api.resend.com/emails` if it does not: a rejected send has no delivery record
      at all, and until this repository's `notify-failed` log existed it left no trace anywhere.
- [ ] **Both Studios open.** `https://espresso-academy-india.sanity.studio` and `/studio` on the
      site. The hosted Studio is a **separate build** from the site: `sanity deploy` builds it with
      Vite, which exposes only `SANITY_STUDIO_`-prefixed variables, so it cannot see any
      `NEXT_PUBLIC_` name however it is set on Vercel. `sanity.cli.ts` bridges the two; if the
      Studio ever boots to "Missing ...PROJECT_ID", that bridge is what to look at.
- [ ] **Turnstile has both halves.** `NEXT_PUBLIC_TURNSTILE_SITE_KEY` *and* `TURNSTILE_SECRET_KEY`,
      in Production and Preview. Vercel refuses a `NEXT_PUBLIC_` variable without an explicit
      public/private choice, which is how the site key went missing the first time; a site key is
      public by design, so the answer is `--type config`. With the secret alone, every booking is
      refused with "We could not verify that you are human."
- [ ] **The paid path end to end on the deployment**: book a seat, pay, and confirm the seat count
      moves, the booking reads `paid` in the Studio, the student's email arrives and the academy's
      does. Any one of those four can fail while the other three look fine.

---

## 4. Switching payments to live

In this order. Each step depends on the one before it.

- [ ] Generate **live** Razorpay API keys.
- [ ] Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and `NEXT_PUBLIC_RAZORPAY_KEY_ID` on Vercel
      **Production only**. Leave Preview on the test keys.
- [ ] Generate a **new** `RAZORPAY_WEBHOOK_SECRET` and run `node scripts/razorpay-webhook.mjs`
      against the live keys. Test-mode and live-mode webhooks are configured separately and do not
      share a secret.
- [ ] **Delete the test batches**: `pnpm sanity:seed:test-batch -- --delete`. They are priced at ₹1
      and labelled "TEST BATCH, do not book"; on live keys a mis-click really does charge a rupee.
- [ ] Redeploy. `NEXT_PUBLIC_RAZORPAY_KEY_ID` is baked into the browser bundle at build time, so
      changing it without a rebuild changes nothing.
- [ ] Make one real payment of the smallest amount you can, and refund it. Confirm the booking
      appears, the seat decrements, the confirmation email arrives and the refund puts the seat
      back.

---

## 5. Domain and indexing

- [ ] Attach the domain: `npx vercel domains add espressoacademy.in`, then follow the DNS
      instructions.
- [ ] Set `NEXT_PUBLIC_SITE_URL=https://espressoacademy.in` and redeploy, so canonicals, Open Graph
      images and JSON-LD `@id`s point at the real host rather than at the Vercel alias.
- [ ] Add the domain as a Sanity CORS origin:
      `npx sanity cors add https://espressoacademy.in --credentials -p msmxj36z`.
- [ ] Add a **second** Razorpay webhook on the new domain, rather than editing the first, so the
      alias keeps working while DNS propagates.
- [ ] **Set `NEXT_PUBLIC_INDEXABLE=true`** and redeploy. Until this moment every response carries
      `X-Robots-Tag: noindex, nofollow`. robots.txt does not change: it already allows the crawl,
      which is what lets a crawler read that header and keep the page out. This is the switch
      that makes the site public to search.
- [ ] **Enable HSTS**: uncomment the `Strict-Transport-Security` header in `src/middleware.ts`.
      **After** the domain is serving HTTPS correctly, never before: a wrong HSTS header is cached
      by every browser that saw it for the whole two-year max-age and cannot be withdrawn.
- [ ] Submit the sitemap in Google Search Console: `https://espressoacademy.in/sitemap.xml`.

---

## 6. Before you tell anyone

- [ ] `pnpm typecheck && pnpm lint && pnpm build && pnpm test:e2e` all green.
- [ ] The four standing scripts against the **deployed** site, not localhost:
      `check-overflow`, `check-brand-contrast`, `check-target-size`, `check-csp`.
- [ ] `node scripts/check-links.mjs https://espressoacademy.in` — every sitemap URL and internal
      link returns 200.
- [ ] `node scripts/lighthouse.mjs https://espressoacademy.in` — Performance ≥ 95, Accessibility
      100, Best Practices ≥ 95, SEO 100. SEO only reaches 100 once indexing is on, so run this
      after step 5.
- [ ] Open the site on a real phone. Tap WhatsApp, tap Call, open the menu, fill the enquiry form.
- [ ] Confirm the enquiry arrived: in the Studio under **Enquiries**, and in the inbox.
- [ ] Check the Studio loads at `/studio` and that the academy can sign in.
- [ ] Take a booking end to end with a real card and refund it (step 4).

---

## Known limitations to carry into launch

These are recorded rather than fixed, with the reasoning in `docs/STATUS.md`:

- **The rate limiter is per-instance.** Serverless functions do not share memory, so the real limit
  is roughly the configured number times the number of running instances. Deliberate for this
  traffic; a shared store is one file away if it is ever needed.
- **Two routes exceed the ≤2.5s LCP budget** on the deployment, at 2.8s (`/courses`) and 2.9s
  (`/calendar`). Performance is ≥95 on every route, so the launch score target is met; the budget
  is not. The cause is understood and the largest remaining lever is the client's photography.
- **Two moderate dependency advisories** remain, both inside the Sanity CLI's tree, reaching nothing
  the site ships.
- **CI runs on GitHub.** The ten repository secrets are set (Sanity, Razorpay test, Turnstile);
  `RESEND_API_KEY` and the Google Sheets credentials are deliberately absent so a test run cannot
  mail the academy or write to their lead sheet. The first run caught a real defect — `tsc --noEmit`
  on a clean checkout cannot see Next's generated `PageProps`/`LayoutProps` — now fixed by running
  `next typegen` ahead of it. The second run showed `e2e` needs longer than its 25-minute cap on the
  two-core runner a private repo gets — no test failed, the job was cut off at 1569 of 1987 — so the
  cap is now 40. Budget about half an hour of billed minutes per push, and shard the job if that
  becomes annoying. Nightly Lighthouse, link and stale-content jobs still need one live run to be
  trusted; check the first one after launch.
- **The mobile sheet's focus trap leaks on WebKit under Playwright.** May be an artefact of
  synthetic key events. Check by hand on a real iPhone before launch.
