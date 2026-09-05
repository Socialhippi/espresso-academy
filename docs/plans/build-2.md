# Build 2 plan: the product behind the draft

Build 1 shipped a complete, reviewed marketing site whose content is hard-coded in
`content/data.ts` and whose only write path is an enquiry email. Build 2 turns it into a product:
the academy edits its own content, a student can pay for a seat, every lead lands in more than one
place, and nothing in the stack takes the site down when a key is missing.

What is explicitly **not** in scope: content. Every TBC state stays a TBC state. No fee, date,
testimonial or claim is invented, and no page that already passed design review is redesigned.

---

## 1. Data model

All content and both operational types live in Sanity. `content/data.ts` stays in the repo as the
seed of record and stops being imported from `src/`.

### Content types

| Type | Key fields | Notes |
|---|---|---|
| `course` | slug, title, skillArea, level, levelLabel, certification→, certificateAwardedLabel, format, isWorkshop, durationDays, durationHours, feeInclGst, emiAvailable, seatsMax, outcome, forWhom[], notForWhom[], modules[], includes[], prerequisites, trainers[]→, nextInLadder→, faq[], heroImage, seo{}, priority | 1:1 with `Course` in data.ts plus `isWorkshop`, `heroImage`, `seo` |
| `venue` | name, address, city, mapsUrl, notes | One document for the campus |
| `courseInstance` | course→, startDate, endDate, schedule, venue→, seatsMax, seatsBooked, status, priceOverride, notes | `seatsBooked` is server-maintained. `seatsAvailable` is derived in GROQ, never stored |
| `certification` | slug, name, shortName, issuer, summary, levels[], recognitionNote, status | 1:1 with data.ts |
| `trainer` | slug, name, role, credentials[{name, issuer}], bio, philosophy, image, sameAs[] | credentials is an array of objects, as in data.ts |
| `story` | name, course→, outcome, quote, image, permission | `permission: false` is invisible to every query |
| `guide` | title, slug, excerpt, body (portable text: question H2, answer-first paragraph, evidence table, callout, FAQ block), author→, reviewedBy→, publishedAt, updatedAt, primaryCourse→, primaryCertification→, seo{} | |
| `faqItem` | question, answer, category, link{label, href} | |
| `page` | slug, title, sections[] from a constrained library | `/for-cafes` is a page document |
| `landingPage` | slug, campaign, sections[] (hero, offer, proof, form, faq), noindex (always true) | |
| `siteSettings` | singleton: everything in `data.ts` siteSettings plus replyPromise, hours, email, whatsappNumber, whatsappText template, razorpayDisplayName, metaPixelIdOverride, refundPolicy | |
| `redirect` | from, to, permanent | Read by `next.config.ts` at build time |

### Operational types

**`booking`** — instance→, course→, name, phone, email, amount, currency, razorpayOrderId,
razorpayPaymentId (unique), status (`created | paid | failed | refunded | cancelled`),
prerequisiteAccepted, source{utm_source, utm_medium, utm_campaign, gclid, fbclid, referrer,
landingPage}, createdAt, paidAt, overbooked, notes.
Read-only in the Studio except `status` and `notes`: a booking is a record of something that
happened at a payment gateway, and an editor changing an amount after the fact would make the two
disagree.

**`enquiry`** — type (`student | waitlist | cafe`), name, phone, email, course→, instance→,
message, source{}, status (`new | contacted | converted | closed`), createdAt, assignedTo.
`status` and `notes` are editable; everything else is the submission as it arrived.

### Validation

- Fee: positive integer (rupees, not paise; paise are computed at order time).
- Image `alt`: 10 to 125 characters, required whenever an image is set.
- Slug: unique per type.
- A `course` cannot be published without at least one trainer and at least four FAQ entries.
- A `courseInstance.startDate` must be in the future unless `status` is `completed`.
- `seatsMax` >= 1.

### Studio structure

Courses · Batches (grouped by month, each row showing `seatsBooked / seatsMax`) · Bookings (newest
first, filtered by status and by batch) · Enquiries (newest first, filtered by status) · Workshops
(`isWorkshop == true`) · Certifications · Trainers · Stories · Guides · FAQs · Pages · Landing pages
· Venues · Settings · Redirects.

Every `courseInstance` gets a **Batch roster** view listing its paid bookings (name, phone, email)
and its waitlist enquiries, so the academy can see who is coming and who to call without leaving
the Studio.

---

## 2. API surface

| Route | Method | Guards | Effect |
|---|---|---|---|
| `/api/orders` | POST | zod, Turnstile, honeypot, 2s time floor, rate limit | Re-reads the instance from Sanity with the write token (no CDN), checks `seatsAvailable > 0`, computes the amount server-side, creates a Razorpay order, creates a `booking` with status `created`. Returns orderId, amount, key id, prefill. |
| `/api/payments/verify` | POST | HMAC over `orderId\|paymentId` | Marks the booking paid **only if the webhook has not already done so**. Never the sole source of truth. |
| `/api/webhooks/razorpay` | POST | `X-Razorpay-Signature` HMAC, idempotent by paymentId | `payment.captured`: one Sanity transaction with `ifRevisionID` on the instance increments `seatsBooked` and sets the booking paid. `payment.failed`, `refund.processed` handled too. Then email + Meta CAPI Purchase. |
| `/api/bookings/[id]/status` | GET | id is an opaque Sanity `_id` | Poll target for the confirmation page. Returns status only. |
| `/api/enquiry` | POST | zod, Turnstile, honeypot, time floor, rate limit | Writes an `enquiry` to Sanity **first**; the response succeeds if that write succeeded. Then fans out in parallel with retries: Resend to the academy and an auto-reply to the student, Google Sheets append, Meta CAPI Lead. Every fan-out failure is logged, none is fatal. |
| `/api/revalidate` | POST | Sanity webhook signature | `revalidateTag` by document type and by slug. |

### The money rule

`/api/orders` never reads an amount from the request body. It reads
`priceOverride ?? course.feeInclGst` from Sanity with the write token (so a just-published change is
visible, which the CDN would not be), multiplies by 100, and sends that to Razorpay. The browser is
told the amount only so it can display it.

### The idempotency rule

Both the webhook and the verify route can arrive first, and the webhook can arrive twice. The
booking's `razorpayPaymentId` is unique and the seat increment happens exactly once, inside a
transaction guarded by the instance's revision id. A second identical webhook returns 200 and
changes nothing. If the increment would take `seatsBooked` past `seatsMax` (two people paying for
the last seat within the same revision window), the booking is still marked paid, flagged
`overbooked: true` and emailed to the academy: taking money and then losing the record is worse
than an overbooking the academy can resolve by hand.

---

## 3. Env matrix

Every row degrades. Nothing in this table can crash a request or block a reader.

| Variable | Feature | Missing ⇒ |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET` | All content | Build-time failure by design: content is not optional. Documented, not degraded. |
| `SANITY_API_READ_TOKEN` | Draft previews, Presentation tool | Published content only; the site renders normally. |
| `SANITY_API_WRITE_TOKEN` | Bookings, enquiries, seat inventory | Enquiries fall back to email-only; booking routes return a TBC state and the page offers WhatsApp. |
| `SANITY_REVALIDATE_SECRET` | `/api/revalidate` | Route returns 401; content still refreshes on the ISR interval. |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Checkout | `/book/[id]` renders the TBC/enquire state; no Book button anywhere. |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook | Route returns 503 and logs; verify-route path still marks bookings paid. |
| `RESEND_API_KEY` + `LEAD_TO_EMAIL` | Lead email | WhatsApp handoff, as in build 1. |
| `BOOKING_TO_EMAIL` | Booking notification | Falls back to `LEAD_TO_EMAIL`. |
| `CAFE_TO_EMAIL` | Cafe enquiries | Falls back to `LEAD_TO_EMAIL`. |
| `GOOGLE_SHEETS_*` (id, client email, private key) | Lead mirror | Skipped and logged. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Bot check | Widget not rendered, verification skipped; honeypot and time floor still apply. |
| `NEXT_PUBLIC_GTM_ID` | GTM | No container loads. `dataLayer` is still pushed, so nothing throws. |
| `NEXT_PUBLIC_META_PIXEL_ID` | Browser pixel | No pixel. |
| `META_CAPI_ACCESS_TOKEN` | Server events | CAPI helper no-ops. |
| `META_TEST_EVENT_CODE` | CAPI test mode | Events go to live rather than test. |
| `NEXT_PUBLIC_CALCOM_LINK` | Cafe thank-you booking embed | WhatsApp button instead. |
| `NEXT_PUBLIC_INDEXABLE` | Indexing | Anything but `"true"` ⇒ `X-Robots-Tag: noindex, nofollow` site-wide and `robots.txt` disallows all. |

---

## 4. Test plan

**Unit (Playwright's runner, no browser):** Razorpay order-signature and webhook-signature
verification including a tampered payload; amount computation from `priceOverride ?? feeInclGst`
including the null-fee case; webhook idempotency (same paymentId twice); the overbooking race path;
Google Sheets formula-injection escaping (`=`, `+`, `-`, `@`, tab, CR).

**End to end (5 browser projects):** every route in `tests/routes.json` returns 200 with one H1 and
no horizontal overflow at 360/390/768/1024/1280; the checkout page renders for a seeded bookable
instance; form validation; `/api/orders` returns a real Razorpay test order; a signed synthetic
webhook marks the booking paid and decrements the seats; the confirmation page renders; the second
identical webhook is a no-op; the sold-out state appears once seats reach zero; each enquiry
variant with each destination failing independently; the dataLayer sequence for both journeys;
security headers; axe with no serious or critical violations.

**Manual, once, recorded:** Razorpay Checkout.js itself with a test card and test UPI, screenshots
into `docs/screens/`. Checkout.js is a third-party iframe and automating it would be testing
Razorpay, not this site.

**Gates:** Lighthouse mobile Performance >= 95 (>= 90 on `/book`, which loads Checkout.js),
Accessibility 100, Best Practices >= 95, SEO 100.

---

## 5. Order of work

0. Housekeeping, CLAUDE.md, this plan.
1. Sanity: schema, Studio, migration, live content. Everything downstream needs the data layer.
2. Booking and payments.
3. Lead pipeline.
4. Remaining pages and templates.
5. Analytics.
6. Security.
7. Tests, accessibility, performance.
8. CI, docs, deploy.

Each phase ends with `pnpm typecheck && pnpm lint && pnpm build && pnpm test:e2e`, a Conventional
Commit, and a "Build 2" entry in `docs/STATUS.md`. If a step fails twice it goes under Known
limitations with its exact error and the work continues.
