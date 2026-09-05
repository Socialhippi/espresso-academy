# Running the website

For whoever edits the site at Espresso Academy India. No code, no developer needed.

Everything is edited in one place: **the Studio**, at
<https://espresso-academy-india.sanity.studio>. Sign in with the Google account that was invited.
Changes appear on the website within a few seconds of pressing **Publish**.

---

## The rule that matters most

**If the academy has not confirmed something, leave it empty.**

The site is built so that an empty field shows a visible "TBC" state rather than a guess. An empty
fee shows "Fee: TBC" and offers a WhatsApp conversation. An empty batch date shows "dates being
finalised" and offers an alert. That is deliberate and it is safe.

What is not safe is filling a field with a number that is nearly right. A fee on the website is a
fee the academy can be held to, and a student who books a seat has paid the amount shown.

---

## Add a batch

A batch is one run of a course, with dates and a number of seats.

1. **Batches → All batches → the pencil icon (create)**.
2. **Course**: pick it.
3. **Status**: `Open` once you want it bookable. Leave it on `Dates to be confirmed` while you are
   still deciding, and the website shows the alert form instead of a date.
4. **Start date** and **End date**.
5. **Schedule**: free text, e.g. "Mon to Fri, 10am to 4pm".
6. **Venue**: the Bengaluru campus.
7. **Seats**: how many people can attend. This is the number the website counts down from.
8. **Fee for this batch**: only if this batch costs something different from the course's own fee.
   Leave it empty and the course fee is used.
9. **Publish.**

The batch appears on the calendar, on its course page and on the workshops page if the course is
marked as a workshop.

### What makes a batch bookable

All three, or the website offers an enquiry instead of a payment:

- a fee, either on the batch or on the course
- status `Open`
- at least one seat left

That is on purpose. There is no way to configure a Book button that leads to a payment for an
amount nobody has set.

---

## Set the seats, and see who is coming

**Seats booked is not editable.** The website maintains it: every paid booking adds one. If you
edit it by hand you would be telling the website a different story from the one the payment
records tell, and one of the two would be wrong.

To change how many seats a batch has, change **Seats**.

To see who is coming: **Batches → Rosters → pick the batch**. You get three lists:

- **Paid bookings** — name, phone, email, for everyone who has paid.
- **All bookings** — including the ones that were started and not completed.
- **Waiting list** — everyone who asked to be told about this batch.

---

## Handle a waiting list

When a batch fills, the website switches its button from Book to Waitlist by itself, and anyone who
uses it lands on the batch's **Waiting list** in the Studio.

Nothing is sent automatically. When a seat frees up or you add a date:

1. Open the batch's **Waiting list**.
2. Message people from the top of the list; the phone number is on each entry.
3. Set each one's **Status** to `Contacted`, then `Converted` or `Closed`.

The status is only for you. It changes nothing on the website.

---

## Change a fee

**Courses → the course → Fee incl. GST.** Whole rupees, no decimal, no comma. The website adds the
"incl. GST" wording; you type `25300`.

For a fee that applies to one batch only, use **Fee for this batch** on the batch instead.

Changing a fee changes what the next person is charged. It does not change anyone who has already
paid.

---

## Refund a booking

Refunds happen in Razorpay, not here. The website records what happened; it never moves money.

1. Razorpay Dashboard → **Transactions** → find the payment → **Refund**.
2. The website is told automatically. The booking becomes `Refunded` and the seat goes back.

If you need to record something a refund does not cover, use the booking's **Notes** field. Notes
and Status are the only two fields on a booking you can change, and that is deliberate: everything
else is a record of what happened at the payment gateway.

### If a booking says "overbooked"

Two people paid for the last seat within the same moment. Both have been charged and both have a
booking. **Bookings → Needs attention: overbooked** lists them, and an email was sent when it
happened. Ring the student, offer the next batch or a refund, and let them choose.

---

## Add a student story

Nothing appears on the website until **Written permission received** is ticked. That is enforced by
the website itself, not by a policy someone has to remember: a story without the tick is invisible
no matter what else is filled in.

1. **Stories → create**.
2. Name, the course they did, what they are doing now, and their words.
3. A photograph if they have given you one.
4. Tick **Written permission received** only when you actually have it, in writing.
5. **Publish.**

---

## Write a guide

Guides are the pages that answer a question properly: "which course should you start with", "what
does a barista course actually cover". They exist to be found in search and quoted by an assistant.

Two are already there as templates, with every paragraph marked PLACEHOLDER. Replace the words and
keep the shape:

- **Excerpt**: the answer, in one or two sentences. This is what a search result shows and what an
  assistant quotes. Write it as if it is the only thing anyone will read.
- **Body**: each question as a **Question (H2)**, and the answer in the first sentence under it. Not
  a build-up to the answer.
- **Evidence table**: when the answer is a comparison.
- **Callout**: when the honest answer is that something is not confirmed yet. Saying so is worth
  more than a confident guess.
- **Questions block**: the short follow-ups.

**Written by** and **Checked by** must be two different trainers. That is what makes a guide an
answer rather than a claim, and both names appear on the page with the date.

### One thing to watch

If your title is longer than about 40 characters, fill in **Search appearance → Title** with a
shorter version. The full site name is added after it, and a search result cuts off at about 60
characters. "Which barista course should you start with?" is a good heading and too long for a
title; "Which Barista Course to Start With" fits.

---

## Edit the pages built from sections

**Pages** and **Landing pages** are assembled from a fixed set of section types: hero, text, offer,
proof, form and questions. You choose which sections and in what order; the design of each one is
fixed.

That is the point. Any page you build this way already follows the brand rules, so it needs no
design review.

**Landing pages are never found in search.** They are for paid advertising, they duplicate a course
page on purpose, and the website keeps them out of Google.

---

## What you cannot do here, and why

| | |
|---|---|
| Create a booking | Bookings are created by the payment gateway. One typed by hand would have no payment behind it. |
| Edit a booking's amount, phone or payment id | It is a record of something that happened at Razorpay. If the two disagreed there would be no way to tell which was right. |
| Edit "seats booked" | The website maintains it from the payments. Change **Seats** instead. |
| Delete the Settings document | There is exactly one, and the whole site reads from it. |
| Turn off "noindex" on a landing page | A campaign page competing in search with the course page it was copied from costs you both. |

---

## When something looks wrong

**A change is not showing.** Did you press Publish, not just save? Publishing takes a few seconds to
reach the website. If it has been more than a minute, tell the developer: the link between the
Studio and the website may need attention.

**A course will not publish.** The Studio will say why. The two usual reasons are no trainer
assigned and fewer than four questions; both are deliberate. A course page that names nobody and
answers nothing is not ready to be public.

**A booking has not appeared.** Check **Bookings → Created, not paid**. A booking sits there when
someone opened the payment window and did not finish. That is normal and no money was taken.

**Somebody says they paid and there is no booking.** Ask them for the time and the amount, and check
Razorpay's Transactions for that window. Then tell the developer, with the payment id.
