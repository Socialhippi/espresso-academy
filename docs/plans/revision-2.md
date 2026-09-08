# Revision 2: rebuild the catalogue from the client's documents

content/facts.md revision 2 (8 Sept 2026) replaces the eight-course catalogue with three courses,
gives the first real fee, and states a booking policy the site does not implement. This is the plan
for bringing the site to it. One commit per group.

## 1. Catalogue

Three courses, three slugs:

| Course | Slug | Days | Seats | Certificate |
| --- | --- | --- | --- | --- |
| Italian Barista Course (IBC), Basic | `italian-barista-course-basic` | 4 | 8 | Italian Barista Certificate, Basic Barista |
| IBC Advanced Barista | `ibc-advanced-barista` | 2 | 4 | Italian Barista Certificate, Advanced Barista |
| IBC Advanced Roasting | `ibc-advanced-roasting` | 2 | 4 | Italian Barista Certificate, Advanced Roasting |

`Level` collapses from six values to two, `basic` and `advanced`. "IBC Junior" is gone from the
type, the badge map, the Sanity schema and every page.

`Course.modules: string[]` becomes `Course.days: CourseDay[]`, because facts.md gives the syllabus
as one module per day and the redirects below have to land on a specific day. Each day renders with
`id="day-N"` on the course page.

Latte Art, Brewing, Roasting and Cupping and the three Barista Skills courses stop being courses.
They are days inside the IBC, so their URLs redirect to the day that now teaches them:

| From | To | Status |
| --- | --- | --- |
| /courses/roasting-and-cupping | /courses/italian-barista-course-basic#day-1 | 301 |
| /courses/brewing | /courses/italian-barista-course-basic#day-2 | 301 |
| /courses/sca-barista-skills-foundation | /courses/italian-barista-course-basic#day-3 | 301 |
| /courses/sca-barista-skills-intermediate | /courses/italian-barista-course-basic#day-3 | 301 |
| /courses/sca-barista-skills-professional | /courses/italian-barista-course-basic#day-3 | 301 |
| /courses/latte-art | /courses/italian-barista-course-basic#day-4 | 301 |
| /courses/italian-barista-certificate-junior | /courses/italian-barista-course-basic | 301 |
| /courses/italian-barista-certificate-advanced | /courses/ibc-advanced-barista | 301 |

Intermediate and Professional both land on day 3 because day 3 is the only barista training the
academy actually runs; there is no intermediate or professional equivalent to send them to.

301, not Next's 308 default, because that is what was asked for. `redirect.statusCode` is added to
the Sanity schema and next.config.ts prefers it over `permanent`.

The Certifications page keeps the SCA explainer and loses every SCA course card: facts.md line 53
says the client's document describes the SCA as a standards body and lists no SCA course, fee or
date the academy offers.

## 2. Pricing

`feeInclGst` is wrong twice over: the client quotes ex-GST and has not given the rate. It is
replaced by:

- `feeExGst` — 26700 on IBC Basic, null on both Advanced courses
- `listPriceExGst` — 35600 on IBC Basic, the price the offer is off
- `offerLabel` — "25% off, 55th batch offer"
- `gstRate` — null everywhere until the client confirms it

`formatFee` prints "₹26,700 + GST" while `gstRate` is null and never derives an incl-GST total from
a rate nobody has confirmed. 18% is in facts.md as an assumption, not a fact, so it is not in the
data. The batch override becomes `priceOverrideExGst` for the same reason.

## 3. Booking

The academy's policy is that ₹5,000 confirms a seat, so that is what the site charges. The order
amount is 5000, not the fee. The booking records `advancePaid` and `balanceDueExGst`
(26700 - 5000 = 21700), and the confirmation page, the confirmation email and the checkout all say
the balance is paid at the academy before the first day, with the reschedule and no-refund terms
next to it.

Full payment online stays in the code behind `BOOKING_FULL_PAYMENT`, off by default. It cannot be
switched on honestly until the GST rate is confirmed, because charging the full fee means charging
the tax.

## 4. Batches

Written to the production dataset:

- IBC Basic: 10-13 Sept, 24-27 Sept, 8-11 Oct 2026, 8 seats each
- IBC Advanced Roasting: 15-16 Sept 2026, 4 seats, no fee

The two ₹1 Playwright batches and the ten ₹1 test bookings that reference them are deleted from
production. They are backed up to a file first, and the backup is not committed: the bookings carry
names, phone numbers and email addresses.

A batch that has started drops off the calendar on its own: the dated-instance query gains an
`endDate >= today` floor rather than relying on an editor to mark it completed.

## 5. Refund policy

Rewritten from facts.md section "Booking, payment and refund policy". The placeholder banner goes.
One "to be confirmed by the academy" line stays, on the academy-cancellation clause, because that
is the one clause facts.md says the client has not signed off.

## 6. Contact

One number: +91 79757 09407, on both call and WhatsApp. 94481 06100 and 98866 46411 are removed.
Email as the client wrote it, with a TODO(client) about the missing "a". Hours 10 am to 7 pm, days
still TBC. Address gains the plot number. Map pin replaced.

## 7. Trainers and About

Nageswara Rao K is added. The other three keep null roles. About gains "over 30 branches", "founded
19 years ago in Florence", the Bullet roaster as the one named piece of equipment, and the faculty
and team lines the client confirmed.

## 8. Home and course copy

The hero, the audience doors and the "how to choose" rows are rewritten around three courses. The
"I love coffee" door pointed at open-level courses that no longer exist; it now points at IBC Basic
day 4 and day 2, which is where latte art and brewing are actually taught.
