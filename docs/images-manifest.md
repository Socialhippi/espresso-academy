# Images manifest

Photos from the client's shoot drop into `public/images/` with these exact names. Until a file exists, the site renders the branded Placeholder for that slot. Drop the file in, redeploy, done; no code changes.

| Slot | Path | Aspect | Used on |
|---|---|---|---|
| hero | public/images/hero.jpg | 3:2 at every width (supply 3:2 at 2400px wide) | Home hero |
| about-campus-1..6 | public/images/about/campus-1.jpg ... campus-6.jpg | 3:2 | About gallery |
| course-<slug> | public/images/courses/<slug>.jpg | 3:2 | Course card + course hero |
| trainer-<slug> | public/images/trainers/<slug>.jpg | 4:5 | Trainer card + profile |
| contact-campus | public/images/contact.jpg | 3:2 | Contact page |
| for-cafes-team | public/images/for-cafes.jpg | 3:2 | For cafes and teams, section 01 |
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
| course-italian-barista-course-basic | `courses/italian-barista-course-basic.jpg` | Hub card and course hero |
| course-ibc-advanced-barista | `courses/ibc-advanced-barista.jpg` | Hub card and course hero |
| course-ibc-advanced-roasting | `courses/ibc-advanced-roasting.jpg` | Hub card and course hero |
| about-campus-1 | `about/campus-1.jpg` | The lead frame of the About gallery |
| for-cafes-team | `for-cafes.jpg` | For cafes and teams, section 01 |

The client sent the last one as `for-cafes-team.jpg`, the slot name rather than the filename in the
table above; it was renamed on the way in.

**Two of the six do not show what their slot is named for**, and neither has been re-described to
flatter the page:

- `courses/italian-barista-course-basic.jpg` is a certificate being handed over, not a class in
  progress. It reads as an outcome, which is defensible on a course card, but it is not teaching.
  **And the certificate in it is redacted**: a hard mosaic block about 350x420px in a 1400x933
  frame, dead centre, with a visible edge. On the page whose whole promise is the Italian Barista
  Certificate, the certificate is pixelated out, and a reader who notices asks what is being
  hidden. Nothing in CSS fixes this. It needs an unredacted frame, or a different photograph from
  the same handover, before launch. **This is the highest-priority photography question.**
- `courses/ibc-advanced-roasting.jpg` shows a student at the bench with the fleur-de-lis behind
  them. There is no roaster, no curve, no cupping table in it. On the Advanced Roasting course it
  is the weakest of the six.

Both are questions for the academy, recorded in docs/STATUS.md, not something to solve in alt text.

Two more for the photographer, neither of them a code change:

- **The six are not graded as one set.** Measured mean luminance runs 73 to 104 and warmth (R-B)
  +14 to +47 across the three course photos alone, so the card row reads as three shoots rather
  than one. Against a #FEFCFF ground they sit as heavy warm blocks. One grade pass over all six,
  lifting shadows and pulling warmth toward a common point, is what makes them belong to a
  white-dominant page.
- **Both Advanced photographs crop the subject's head at the top edge of the file**, and in both
  the subject is looking down, so no card on /courses shows a face to camera except the certificate
  one. Frames with headroom would fix both at once.

The hero was re-framed rather than re-shot: its 4:5 mobile crop kept only 53% of the width and cut
the second subject through the eye line, so the component now uses 3:2 at every width. Supply 3:2;
nothing crops it any further.

Still outstanding: `about/campus-2.jpg` to `campus-6.jpg`, `contact.jpg`, `courses-hub.jpg`, and
`trainers/nageswara-rao-k.jpg`. Each keeps its branded placeholder, which prints its own slot name,
so the page itself says which file is missing.

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
