# Images manifest

Photos from the client's shoot drop into `public/images/` with these exact names. Until a file exists, the site renders the branded Placeholder for that slot. Drop the file in, redeploy, done; no code changes.

| Slot | Path | Aspect | Used on |
|---|---|---|---|
| hero | public/images/hero.jpg | 3:2 at every width (supply 3:2 at 2400px wide) | Home hero |
| about-campus-1..6 | public/images/about/campus-1.jpg ... campus-6.jpg | 3:2 | About gallery |
| course-<slug> | public/images/courses/<slug>.jpg | 3:2 | Course card + course hero |
| trainer-<slug> | public/images/trainers/<slug>.jpg | 4:5 | Trainer card + profile |
| contact-campus | public/images/contact.jpg | 3:2 | Contact page |
| courses-hub | public/images/courses-hub.jpg | 3:2 | Courses hub hero. The hero runs full width until this file lands, rather than holding an empty frame open |
| og-default | generated | 1200x630 | Open Graph |

Rules: JPEG or WebP, sRGB, max 2400px on the long edge, under 600KB each. No AI-generated people.

Alt text lives in the `ALT` map in `src/lib/photos.ts`, beside the rule that turns a slot into a
path. It moved there from content/data.ts because build 2 stopped `src/` importing that file: the
site's text comes from Sanity now, and a photograph committed to this repository has no Sanity
document to carry its alt. A file and its description are one commit, which is the only arrangement
where a photograph cannot be swapped without its alt being reconsidered. `content/data.ts` keeps
`heroAlt` as the seed of record for the courses, and the two are kept in step.

A photograph uploaded to the Studio instead carries its own alt, authored with the upload, and
outranks a file of the same slot in this repository: an upload is the academy choosing that picture
for that course, where a file is whatever was last committed.

`src/lib/photos.ts` is the one place that knows the naming scheme, because the scheme is not
uniform: `hero.jpg`, `courses/<slug>.jpg`, and a `for-cafes-team` slot whose file is
`for-cafes.jpg`.

Logo: public/logo/lockup-on-white.png, lockup-on-black.png, mark.png (raster renders extracted from the guideline PDF; replace with SVG when the client sends it, keeping the same file names with .svg and updating the Logo component import).

Reel: not used in the draft. When the reel arrives, a muted, poster-first, 12-second loop can replace the hero photo on desktop only, behind a prefers-reduced-motion check.


## What has landed, 15 September 2026

Six photographs from the client's shoot, pre-cropped to 3:2, sRGB, EXIF stripped and rotation
baked in:

| Slot | File | Where it shows |
|---|---|---|
| hero | `hero.jpg` | Home hero, and the measured LCP element on that route |
| course-italian-barista-course-basic | `courses/italian-barista-course-basic.jpg` | Hub card and course hero. **This is the cupping-pair photograph**, moved here from the for-cafes slot on 17 September; see below |
| course-ibc-advanced-barista | `courses/ibc-advanced-barista.jpg` | Hub card and course hero |
| course-ibc-advanced-roasting | `courses/ibc-advanced-roasting.jpg` | Hub card and course hero |
| about-campus-1 | `about/campus-1.jpg` | The lead frame of the About gallery |
| ~~for-cafes-team~~ | ~~`for-cafes.jpg`~~ | **Slot retired 17 September.** Its photograph moved to the IBC Basic course and /for-cafes now renders no image frame at all — see below |

The client sent the last one as `for-cafes-team.jpg`, the slot name rather than the filename in the
table above; it was renamed on the way in.

**Two of the six do not show what their slot is named for**, and neither has been re-described to
flatter the page:

- ~~`courses/italian-barista-course-basic.jpg` is a certificate being handed over, with the
  certificate itself mosaicked out.~~ **Resolved 17 September 2026 by deleting that file.** A
  redaction cannot sit on the one course whose entire promise is that certificate: a reader who
  notices asks what is being hidden, and nothing in CSS fixes a mosaic baked into a JPEG. The file
  is gone from the repository rather than merely unreferenced.

  The cupping-pair photograph took its place, moved across from the for-cafes slot. It is a better
  fit than a swap of convenience suggests: Day 1 of the IBC Basic is *Roasting and Cupping*, and
  the photograph is two people cupping. The academy is still owed a photograph of a class in
  progress, and now also one of a cafe team.
- `courses/ibc-advanced-roasting.jpg` shows a student at the bench with the fleur-de-lis behind
  them. There is no roaster, no curve, no cupping table in it. On the Advanced Roasting course it
  is the weakest of the six.

Both are questions for the academy, recorded in docs/STATUS.md, not something to solve in alt text.

Two more for the photographer, neither of them a code change:

- **They are not graded as one set.** Re-measured after the 17 September swap, across the three
  course photographs: mean luminance 52 (IBC Basic, the cupping frame), 74 (Advanced Barista), 76
  (Advanced Roasting); warmth (R-B) +36, +47, +15. The grade is consistent enough — same lens,
  same room, same warm cast — but the exposure is not, and the swap put the darkest of the three
  in first position, so the hub row now runs dark, mid, mid against a #FEFCFF ground. One pass
  lifting the cupping frame's shadows by roughly 15 levels, and its highlights toward the p90 of
  about 130 the other two sit at, is what makes the row read as one body of work.
- **All three course photographs crop a head at the top edge of the file**, and in all three the
  subject is looking down. That last clause used to end "except the certificate one"; the
  certificate photograph is gone, so **no card on /courses shows a face to camera at all**, which
  is the live state of the page rather than a prediction about it. One frame with headroom and one
  subject looking up would fix the lead card, and the lead card is the one that matters.

The hero was re-framed rather than re-shot: its 4:5 mobile crop kept only 53% of the width and cut
the second subject through the eye line, so the component now uses 3:2 at every width. Supply 3:2;
nothing crops it any further.

Still outstanding: `about/campus-2.jpg` to `campus-6.jpg`, `contact.jpg`, `courses-hub.jpg` and
`trainers/nageswara-rao-k.jpg`. Each keeps its branded placeholder, which prints its own slot name,
so the page itself says which file is missing.

**/for-cafes is the exception, and it is deliberate.** That route has no image frame — not a
placeholder, not a guarded slot, nothing. A lone placeholder there was 70% of its column at 1280
and sat between the H2 and the first sentence at 390, on the one route aimed at a paying cafe
owner, so the copy takes the full column instead and the section reads as finished rather than as
waiting.

Three things were removed together and they have to come back together: the slot row in the table
above, the `for-cafes-team` branch in `slotToStem`, and the `ALT` entry, all in
`src/lib/photos.ts`. So a team photograph dropped into `public/images/` **cannot** appear on that
page by itself. That is the intent: the last time this slot held a picture it was a photograph of
something else, and the failure it would have caused — a new file silently inheriting the old
file's alt — is the one a reader cannot detect. Putting a picture back on /for-cafes is a
deliberate edit that decides where it sits and writes what it shows.

## Replacing a photograph is not the same as adding one

Adding a file to an empty slot is what the top of this page describes and it works: drop it in,
redeploy, done.

**Replacing a file at a path that already had one does not, on its own, change what a local server
serves.** Next's image optimiser caches by source URL, width and quality, and `Vary: Accept` gives
AVIF and JPEG separate keys. Swap the bytes on disk and the warm AVIF key in `.next/cache/images`
keeps answering with the old picture — at every width the pages actually request, because those
are the widths that were warmed. Found the hard way on 17 September: the mosaicked certificate
photograph had been deleted from the repository and `pnpm start` went on serving it to every
AVIF-capable browser, which is every modern one. Only `w=1200`, a width nothing requests, was
clean. A design review ran against that server and reviewed the withdrawn photograph.

**A deployment is not affected, and this was checked rather than assumed.** Vercel keys its image
cache per deployment, so a redeploy starts clean: probed at 384, 640, 828, 1080, 1200 and 1920
immediately after the swap shipped, production returned the new photograph at every width, and
`w=1920` came back 1800px wide — the new source's width, where the withdrawn 1400px file would
have capped at 1400. So this is a local trap, not a production one.

The part that does reach readers is narrower and cannot be undone: responses carry
`Cache-Control: public, max-age=14400, must-revalidate`, so anyone who loaded the old image from
the previous deployment keeps it for up to four hours. Nothing short of changing the URL fixes
that, which is the argument for serials below.

So, when replacing rather than adding:

1. `rm -rf .next/cache/images` and restart, locally.
2. Verify as a browser does, not as `curl` does by default — the `Accept` header decides which
   cache key answers:

   ```
   curl -sD- -o /tmp/probe.avif -H 'Accept: image/avif,image/webp,*/*'      "http://localhost:3000/_next/image?url=%2Fimages%2Fcourses%2F<slug>.jpg&w=384&q=75"
   ```

   `X-Nextjs-Cache: MISS` and the new picture, at 384, 640, 828 and 1080. A `HIT` at any of those
   means you are looking at the old one.
3. After deploying, run the same probe against the deployment before believing the swap is live.
   Expect `x-vercel-cache` rather than `X-Nextjs-Cache`; a `HIT` there is fine, because the cache
   is per deployment. Check the bytes, not the header.

A versioned query string is not a way round it: the optimiser answers
`400 "url" parameter is not allowed`. If in-place replacement ever becomes routine rather than a
one-off, give the files a serial (`courses/<slug>-2.jpg`) and teach `slotToStem` in
`src/lib/photos.ts` to pick the highest one, so a replacement is always a new URL and no cache
anywhere has to be trusted.

## Permission to publish, answered 8 September 2026

The client confirmed that students photographed in the shoot may appear on the site, and that the
academy takes an image down on request. That closes open question 9 in `content/facts.md` and is
what unblocks the Drive folder.

Two things follow when the files land:

- The takedown promise is the academy's and belongs where a student can act on it. It is not a
  privacy-policy footnote: someone who wants their face off a page needs to see how, on the page.
  **Done 15 September 2026**: a line under the About gallery says everyone in the photographs is a
  student or a member of the team, photographed with their permission, and links to /contact for
  anyone who would rather not be. It renders only once a photograph does, because a takedown offer
  under six empty frames is a promise about nothing.
- The permission is to publish, not to invent. Nothing here changes rule 8 in CLAUDE.md: no
  AI-generated people, campus or coffee imagery, ever.
