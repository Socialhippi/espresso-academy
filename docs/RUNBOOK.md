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

| Task | Command |
|---|---|
| Studio, locally | `pnpm sanity` (or `/studio` on any deployment) |
| Deploy the Studio | `pnpm sanity:deploy` → <https://espresso-academy-india.sanity.studio> |
| Seed from `content/data.ts` | `pnpm sanity:seed` (idempotent; safe to re-run) |
| Seed the test batches | `pnpm sanity:seed:test-batch` |
| Delete the test batches | `pnpm sanity:seed:test-batch -- --delete` |
| Export the dataset | `pnpm sanity:export` → a `.tar.gz` in the repo root |
| Restore a dataset export | `npx sanity dataset import <file>.tar.gz production --replace` |

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

## Deploying

```
pnpm typecheck && pnpm lint && pnpm build && pnpm test:e2e     # the gate
npx vercel deploy --prod --yes                                 # the public alias
node scripts/check-overflow.mjs https://espresso-academy-india.vercel.app
node scripts/check-brand-contrast.mjs https://espresso-academy-india.vercel.app
node scripts/check-target-size.mjs https://espresso-academy-india.vercel.app
```

Run the three standing scripts against the deployment, not only against localhost.

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
