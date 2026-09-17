# Runbook

How to operate this site. Every command runs from the repo root.

---

## Razorpay: the webhook

**Already created**, from the API rather than the dashboard: a Razorpay account still in onboarding
has the webhook page locked, and the API works throughout.

```
node scripts/razorpay-webhook.mjs --list     # show every webhook on the account
node scripts/razorpay-webhook.mjs            # create it, or update it in place if it exists
node scripts/razorpay-webhook.mjs --url <u>  # point it somewhere else, e.g. a custom domain
```

The script reads `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` from
`.env.local`, and it never prints the secret. It is idempotent: run it again and it updates the
existing webhook rather than creating a second one.

Current state, test mode:

| | |
|---|---|
| id | `TYIvVXmFjKQMlA` |
| url | `https://espresso-academy-india.vercel.app/api/webhooks/razorpay` |
| events | `payment.captured`, `payment.failed`, `refund.processed` |
| secret | set, and it matches `RAZORPAY_WEBHOOK_SECRET` |
| active | yes |

`refund.created` is handled too, if anyone ever ticks it; it is not registered, because
`refund.processed` is the one that means the money has actually moved.

**The URL 404s until the site is deployed with these routes.** That is expected between now and the
deploy phase: the webhook is configured correctly and Razorpay will retry, so nothing is lost.

### Doing it by hand instead

If the dashboard is available and you would rather use it: **Account & Settings → Webhooks → Add
New Webhook**, same URL, same three events, and paste the value of `RAZORPAY_WEBHOOK_SECRET`. Read
it with:

```
grep RAZORPAY_WEBHOOK_SECRET .env.local
```

It is deliberately not written down here. `.claude/rules/git.md` forbids committing a secret, and
this file is in git.

### Testing a delivery

`Send Test Webhook` in the dashboard, if you have it. Otherwise sign a payload yourself — this is
the smoke test that was run against the local build:

```
BODY='{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_test_1","order_id":"<a real order id>","status":"captured"}}}}'
SIG=$(node -e 'const c=require("crypto");console.log(c.createHmac("sha256",process.env.RAZORPAY_WEBHOOK_SECRET).update(process.argv[1]).digest("hex"))' "$BODY")
curl -X POST "$SITE/api/webhooks/razorpay" -H "content-type: application/json" -H "x-razorpay-signature: $SIG" -d "$BODY"
```

Expect 200 and `handled: true` the first time, 200 and `idempotent: true` the second, and 400 for a
wrong signature or a body edited after signing.

### What the webhook does

Verifies the signature over the raw body, then, for `payment.captured`, marks the booking paid and
increments the batch's `seatsBooked` inside one Sanity transaction guarded by the batch's revision
id. It is idempotent: Razorpay retries anything that does not answer 2xx, and the browser's verify
call races it, so a second delivery of the same event answers 200 and changes nothing.

If the seat increment would take the batch past `seatsMax` — two people paying for the last seat
inside the same revision window — the booking is **still marked paid** and flagged `overbooked`,
and an email goes to `BOOKING_TO_EMAIL`. Taking money and then having no record of it is worse than
an overbooking a human can resolve. Overbooked bookings have their own list in the Studio, under
Bookings → "Needs attention: overbooked".

---

## Razorpay: switching from test keys to live keys

1. In the Razorpay dashboard, switch the toggle to **Live** and generate live API keys.
2. Set on Vercel (Production only — leave Preview on the test keys):
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID` (same value as `RAZORPAY_KEY_ID`)
3. Add a **second webhook** on the live mode with the same URL and a **new** secret. Test-mode and
   live-mode webhooks are configured separately and do not share a secret, so: generate a new
   secret, put it in `RAZORPAY_WEBHOOK_SECRET`, set the live keys in the environment, then run
   `node scripts/razorpay-webhook.mjs`. The script talks to whichever mode its keys belong to.
4. Delete the test batches: `pnpm sanity:seed:test-batch -- --delete`. They are labelled
   "TEST BATCH, do not book" and priced at ₹1; on live keys a mis-click really does charge a rupee.
5. Redeploy. `NEXT_PUBLIC_RAZORPAY_KEY_ID` is inlined into the browser bundle at build time, so
   changing it without a rebuild changes nothing.

---

## Razorpay: the manual checkout test

Checkout.js is a third-party iframe on a third-party origin. The automated suite covers everything
on this side of it — the page, the form, the order, the webhook, the seat, the confirmation — and
this is the part that is run by hand after any change to the checkout.

1. `pnpm sanity:seed:test-batch` (creates a ₹1 batch with 40 seats, plus a one-seat batch for the
   sold-out path).
2. Open `/book/instance-e2e-test-batch`, fill the form, press **Pay ₹1 and book the seat**.
3. Pay with a **domestic** test card:

   | Field | Value |
   |---|---|
   | Card | `5267 3181 8797 5449` |
   | Expiry | any future date, e.g. `12 / 30` |
   | CVV | any three digits |
   | OTP | `1234` |

   **Do not use `4111 1111 1111 1111`.** It is an international test card, and this account has
   international payments disabled, so it fails with "International cards are not supported". That
   is the account behaving correctly, not a bug in the site.

4. UPI does not appear in the test-mode options on this account. Enable it in the dashboard under
   Payment Methods if the academy wants it; nothing in the code needs to change, because Checkout.js
   renders whatever the account has enabled.
5. Expect a redirect to `/booking/<id>` reading "Your seat is booked", and the batch's seat count
   down by one.

Screenshots of a passing run: `docs/screens/razorpay-checkout-390.png`,
`razorpay-card-390.png`, `razorpay-otp-390.png`, `booking-confirmed-390.png`.

---

## Sanity

### Two datasets, and which one you are pointed at

| Dataset | What it holds | Who writes to it |
|---|---|---|
| `production` | the real site: content, bookings, enquiries | the deployed site, and the Studio |
| `ci` | a seeded copy of `content/data.ts` plus the two ₹1 test batches | the test suite, and nothing else |

**The test suite must never run against `production`.** It creates bookings, takes seats and
deletes documents: `tests/global-setup.ts` wipes every booking against the test batches before each
run so the suite starts from a known state. While that ran against `production` a CI run deleted a
real booking out of the academy's live dataset. `tests/global-setup.ts` now **throws** unless
`NEXT_PUBLIC_SANITY_DATASET` is exactly `ci`, so the whole run stops before a single test can write
to the wrong place.

- `pnpm test:e2e` sets `NEXT_PUBLIC_SANITY_DATASET=ci` itself. Use it rather than `playwright test`.
- `.github/workflows/ci.yml` sets `ci` literally rather than from a secret, so it cannot be
  repointed at production by editing a secret. The nightly's stale-content report still reads
  `production` from the secret, which is correct: it reports on the academy's real content.
- Sanity tokens are project-scoped, not dataset-scoped, so `ci` needs no new tokens or webhook.
- `ci` is disposable. If it drifts from the schema, delete it and seed it again.

| Task | Command |
|---|---|
| Studio, locally | `pnpm sanity` (or `/studio` on any deployment) |
| Deploy the Studio | `pnpm sanity:deploy` → <https://espresso-academy-india.sanity.studio> |
| Seed from `content/data.ts` | `pnpm sanity:seed` (idempotent; safe to re-run) |
| **Seed the whole `ci` dataset** | `pnpm sanity:seed:ci` (content + both test batches) |
| Seed the test batches | `pnpm sanity:seed:test-batch` |
| Delete the test batches | `pnpm sanity:seed:test-batch -- --delete` |
| Export the dataset | `pnpm sanity:export` → a `.tar.gz` in the repo root |
| Restore a dataset export | `npx sanity dataset import <file>.tar.gz production --replace` |
| Recreate `ci` from nothing | `npx sanity dataset create ci --visibility private && pnpm sanity:seed:ci` |

**The two ₹1 test batches still exist in `production`** as well, and stay there only until Ashrith
has finished his manual checks. Delete them with `pnpm sanity:seed:test-batch -- --delete` before
switching to live Razorpay keys — on live keys a mis-click really does charge a rupee. The copies in
`ci` stay.

### Rotating a Sanity token

```
npx sanity tokens list -p msmxj36z
npx sanity tokens create "web-read" -p msmxj36z --role viewer -y --json
npx sanity tokens delete <old-token-id> -p msmxj36z -y
```

Then update `SANITY_API_READ_TOKEN` (or `SANITY_API_WRITE_TOKEN`) in `.env.local` and on Vercel,
and redeploy. The read token is needed at build time: a build without it fails, by design, because
a site with no content is not a site.

### Revalidating everything

Content refreshes within a second of a publish through the Sanity webhook. To force it:

```
npx vercel redeploy <deployment-url>
```

The Sanity publish webhook is already configured to `POST https://espresso-academy-india.vercel.app/api/revalidate`
with `SANITY_REVALIDATE_SECRET`. If it stops working, the site is still correct within an hour:
`src/lib/content.ts` sets a one-hour revalidate floor underneath the tags.

---

## CI: what runs when

| Trigger | Job | What it runs | Cap |
|---|---|---|---|
| every push and PR | `static` | typecheck, lint, the unit project | — |
| every push and PR | `secrets` | gitleaks | — |
| every push and PR | `audit` | `pnpm audit --audit-level high` | — |
| every push and PR | **`smoke`** | build, `--project=smoke` (chromium, 10 checks), then `check-overflow` and `check-csp` | 12 min |
| nightly 03:00 IST, or `gh workflow run nightly.yml` | **`full-suite`** | build, the whole matrix on chromium and webkit plus the four device projects, then all four standing scripts | 40 min |
| nightly | `lighthouse`, `links`, `stale-content` | production checks and the reports | — |
| nightly | `lead-failures` | counts leads stored but never emailed; job summary always, alert email only when above zero | — |

**Why the split.** The full matrix is about 2069 tests and takes half an hour on the two-core runner
a private repository gets. Half an hour before every commit is how a gate stops being a gate:
people push and stop watching, and a red run gets read as "the slow one is unhappy again". The
smoke set is the shortest that would have caught what has actually broken here — a checkout that
could not be reached, a bot check nobody could pass, a page rendering its author's brief, a robots
file that cancelled out its own noindex.

**Run the full suite before anything that matters**: a deploy, a release, a change to the payment
or lead paths. `gh workflow run nightly.yml` and watch, or `pnpm test:e2e` locally.

Anything the smoke set starts catching that the nightly does not is a sign the nightly is missing
coverage, not that the smoke file should grow.

## Ending the 55th-batch offer

The IBC Basic is sold at ₹26,700 + GST instead of ₹35,600 + GST, and the academy has said the
offer runs until its **70th batch**. Nothing in this repository can count batches, and no end date
is shown on the site, because a reader cannot check a batch count and a date the academy has not
committed to would be a promise nobody made.

So ending it is one action:

1. Open the Studio, `/studio`, and the **Italian Barista Course (IBC), Basic** document.
2. Under **Fee and format**, untick **Offer is running**.
3. Publish.

The standard fee is charged from that moment: on the card, on the course page, in the fee table, at
the checkout and in the amount the gateway is asked for. The strike-through and the offer chip
disappear with it. `src/lib/batch.ts` resolves all six from one function, `courseFeeExGst`, so
there is no second number to remember and no deploy to wait for.

Do not do this by editing the fee. `feeExGst` is the standard fee and `offerFeeExGst` is the
discounted one; swapping the numbers would leave a course that charges the right amount and shows
a strike-through against itself.

## Deploying

**A push to `main` now deploys to production by itself.** The project was connected to
`Socialhippi/espresso-academy` on 15 September 2026; before that every deploy was a manual
`vercel deploy --prod`, and two of them were, which is why the photography sat on `main` for an
hour looking deployed and was not.

The consequence is the thing to hold on to: **the gate below is no longer enforced by the act of
deploying.** It used to be, accidentally — you could not ship without typing the deploy command,
and the command sat under the gate in this file. Now a commit reaches production whether or not
anybody ran the suite. Run it before you push, not after:

```
pnpm typecheck && pnpm lint && pnpm build && pnpm test:e2e     # the gate. Before `git push`.
git push origin main && git rev-parse --short origin/main      # this is the deploy
```

Then, once the deployment is live, the four standing scripts against it:

```
node scripts/check-overflow.mjs https://espresso-academy-india.vercel.app
node scripts/check-brand-contrast.mjs https://espresso-academy-india.vercel.app
node scripts/check-target-size.mjs https://espresso-academy-india.vercel.app
node scripts/check-figures.mjs https://espresso-academy-india.vercel.app
```

Run them against the deployment, not only against localhost.

`npx vercel deploy --prod --yes` still works and is still the way to ship something that is not a
push: a rebuild after an environment variable changes, or a redeploy after Sanity content lands.

GitHub would be the better place to enforce this — `Smoke` as a required status check on `main`,
so the rule holds for every clone and nobody can walk past it. **It is not available on this
repository.** It is private on a free personal account, and both `branches/main/protection` and
`rulesets` answer `403 Upgrade to GitHub Pro or make this repository public`. Making the repository
public is not an option and the account has not been upgraded, so the gate lives in
`.githooks/pre-push` instead.

That hook runs typecheck, lint, build and the unit and smoke projects before a push to `main`, and
refuses the push if any of them fail. Three things to know about it:

- **It is advisory.** A local hook only runs for someone who has run
  `git config core.hooksPath .githooks`, and `git push --no-verify` walks past it. It is a
  seatbelt, not a lock. Upgrade the account or make the repository public and this becomes a real
  required check in about a minute; the hook says so in its own header.
- **It skips a push that changes nothing built.** A docs or screenshot commit does not pay four
  minutes. The paths that trigger it are `src/`, `content/`, `sanity/`, `public/`, `tests/` and the
  build config.
- **It refuses to run while something is listening on :3000.** `playwright.config.ts` sets
  `reuseExistingServer`, so a stray `pnpm dev` would be tested instead of the commit being pushed.
  This is not hypothetical: it made the checkout smoke test fail against a commit that was fine
  while the hook was being written.

Skip it deliberately with `SKIP_GATE=1 git push`, and then run the gate yourself.

### When a field stops being null

Run all four, and look at the routes the field touches at 390, 1024 and 1280. This has caught
something every time:

- `settings.email` went from a 40px TBC pill to a 29-character unbreakable token. It pushed every
  route 127px sideways at 1024, where the footer's four columns are tightest, and turned the
  contact link into a 26px touch target. 390, 768 and 1280 were all clean.
- `course.gstRate` turned every one-figure fee cell into a three-figure one, and revealed that the
  suffix helper had been labelling the ex-GST figure "incl. GST" from the moment a rate existed.

A pill is not a value. Nothing that was reviewed while a field was null has been reviewed.

### Rolling back

```
npx vercel ls espresso-academy-india          # find the previous deployment URL
npx vercel promote <deployment-url>           # point the alias at it
```

A rollback does not roll back Sanity. Content is a separate system with its own history: use the
Studio's document history to revert a document.

---

## Launch steps

In this order:

1. Delete the test batches: `pnpm sanity:seed:test-batch -- --delete`.
2. Switch Razorpay to live keys (above), including a live-mode webhook and its own secret.
3. Verify the academy's sending domain in Resend and set `RESEND_FROM_EMAIL` to an address on it.
   Until then mail comes from `onboarding@resend.dev`, which reaches an inbox but does not say
   Espresso Academy in the sender line.
4. Set `NEXT_PUBLIC_INDEXABLE=true` on Vercel and redeploy. Until then every response carries
   `X-Robots-Tag: noindex, nofollow`. robots.txt allows the crawl in both states, which is what
   lets a crawler read that header; only the header changes at launch.
5. Enable HSTS: uncomment the `Strict-Transport-Security` header in `next.config.ts`. Do this
   **after** the domain is attached and serving over HTTPS correctly, not before: a wrong HSTS
   header is cached by browsers for its whole max-age and cannot be withdrawn.
6. Attach the domain: `npx vercel domains add espressoacademy.in` and follow the DNS instructions,
   then set `NEXT_PUBLIC_SITE_URL=https://espressoacademy.in` and redeploy so canonicals, Open Graph
   images and JSON-LD `@id`s point at the real host.
7. Add the domain as a Sanity CORS origin: `npx sanity cors add https://espressoacademy.in --credentials -p msmxj36z`.
8. Add a second Razorpay webhook on the new domain.

---

## Refunding a booking

Refunds are issued in Razorpay, not here. The site records what happened; it does not move money
on its own.

1. Razorpay Dashboard → Transactions → find the payment → **Refund**.
2. The `refund.processed` webhook arrives, sets the booking to `refunded` and gives the seat back
   to the batch. A booking flagged `overbooked` never took a seat, so refunding it does not add one.
3. If the webhook is not configured yet, set the booking's status to `refunded` by hand in the
   Studio and adjust the batch's seat count with it.
