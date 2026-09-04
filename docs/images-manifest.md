# Images manifest

Photos from the client's shoot drop into `public/images/` with these exact names. Until a file exists, the site renders the branded Placeholder for that slot. Drop the file in, redeploy, done; no code changes.

| Slot | Path | Aspect | Used on |
|---|---|---|---|
| hero | public/images/hero.jpg | 4:5 mobile crop, 3:2 desktop (supply 3:2 at 2400px wide; the component crops) | Home hero |
| about-campus-1..6 | public/images/about/campus-1.jpg ... campus-6.jpg | 3:2 | About gallery |
| course-<slug> | public/images/courses/<slug>.jpg | 3:2 | Course card + course hero |
| trainer-<slug> | public/images/trainers/<slug>.jpg | 4:5 | Trainer card + profile |
| contact-campus | public/images/contact.jpg | 3:2 | Contact page |
| og-default | generated | 1200x630 | Open Graph |

Rules: JPEG or WebP, sRGB, max 2400px on the long edge, under 600KB each. No AI-generated people. Alt text comes from content/data.ts (heroAlt, trainer name) and docs alt list; if a slot needs a new alt, add it to data.ts.

Logo: public/logo/lockup-on-white.png, lockup-on-black.png, mark.png (raster renders extracted from the guideline PDF; replace with SVG when the client sends it, keeping the same file names with .svg and updating the Logo component import).

Reel: not used in the draft. When the reel arrives, a muted, poster-first, 12-second loop can replace the hero photo on desktop only, behind a prefers-reduced-motion check.
