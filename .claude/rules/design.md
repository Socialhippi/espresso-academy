---
paths: ["src/**"]
---
# Design rules (from the client's brand guidelines, translated for web)

## Tokens (design/tokens.css). Use only these.
- Grounds: white #FEFCFF (default), white-2 #E4E4E4 (alt sections), white-3 #F4F3F5 (cards, inputs), black #171717 (ONE dark section per page + footer), black-2 #373737.
- Text: black on white; white on black; grey #6B6B6B secondary on white; #C9C9C9 secondary on black.
- Accent: red #B20003 (primary buttons, links on white, eyebrow labels on white, active states). red-deep #640000 hover/pressed. red-tint #EFCACD selected chips.
- Level badges only: mustard #F1BD00 (Foundation, black text), blue #030696 (Intermediate, white text), purple #490396 (Professional, white text). Never as section grounds or body text.
- Focus ring: blue #030696, 2px, 2px offset, everywhere.

## Contrast rules (computed, non-negotiable)
- Red text on black or black-2 is FORBIDDEN (2.47:1). On dark sections red is a button ground with white text, or a 1px rule.
- Mustard text is FORBIDDEN anywhere. Mustard is a badge ground with black text.
- Red text on white is fine at >= 16px (7.11:1). White on red is fine (7.11:1).

## Typography
- Display: Bebas Neue (uppercase by design). H1, section numerals, fee figures, batch dates. Minimum 24px. Never nav, body, labels, buttons.
- Text: Montserrat (stand-in for Gotham until a web licence is confirmed). 500 for H2/H3/buttons/labels, 400 for body. Body 16px min on mobile, 17px desktop, line-height 1.6, measure <= 68ch.
- Scale mobile/desktop: display 40/72, h1 36/56, h2 28/40, h3 20/24, body 16/17, small 14, label 12 uppercase tracking 0.08em.
- The red gradient (#B20003 to #640000) on text is allowed ONCE: the homepage hero H1. Nowhere else.

## Layout
- 8px spacing grid. Section padding 64px mobile / 128px desktop. Container 1200px, gutters 20/32.
- Radius: 4px inputs and chips, 8px cards, 999px buttons (the brand's pill). No 24px blobs.
- Elevation: none by default; cards separate by ground and 1px white-2 border. One shadow-sm token for the sticky bar and dialogs.
- Section eyebrow: red uppercase label with a numeral ("01  Courses"), hairline above each section.
- Exactly one black section per page (with a subtle #640000 radial glow at 25%), placed below the fold.
- Photography full-bleed or in 3:2 / 4:5 frames. Text never sits on top of an image.

## Components
- Buttons: primary red/white pill 48px mobile 44px desktop; secondary black outline 1.5px; tertiary red underlined link; WhatsApp button is BLACK ground with the glyph (red stays singular).
- Course card: photo 3:2, level badge top-left, Bebas fee and next-date numerals, Montserrat title, spec row (duration, format, certificate), TBC pill when a value is null, full-card link, hover = title underline + arrow shift 4px. No scale transforms.
- Level ladder: Foundation > Intermediate > Professional with the badge colours; text equivalent for screen readers.
- Forms: label above, 16px input text, white-3 ground, 1px white-2 border, blue focus ring, red-deep error text with icon and aria-describedby, pill submit.
- States: skeletons for content, spinners only inside buttons, empty state copy + WhatsApp, error state shows WhatsApp fallback.
- Motion: <= 8 animated moments per page, <= 400ms, fade-up 16px once on scroll, underline draws, no parallax except hero image at most 8px, all gated by prefers-reduced-motion. No smooth-scroll libraries.

## Must never look like
SaaS landing page (gradient blobs, icon-in-circle feature grids, logo bars), Bootstrap (default blue, centred everything), AI template (Inter, rounded-2xl everywhere, glassmorphism, emoji bullets, "Unlock your potential"), over-animated portfolio, café website (bean bokeh, latte-art hero, chalkboard), or a bar/gym (all-dark, red everywhere). The brand is bold but the site is white-dominant, disciplined, photographic.

## Logo
- public/logo/ holds the raster lockups until the SVG arrives. Header: horizontal lockup 32px tall on white. Footer: on-black lockup. Clear space = height of the portafilter circle; enforce via padding. No effects, outlines, recolours, rotation, crops.
