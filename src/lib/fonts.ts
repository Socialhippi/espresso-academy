/**
 * Self-hosted brand fonts.
 *
 * The woff2 files come from `@fontsource-variable/montserrat` and `@fontsource/bebas-neue`
 * and are served from this repo, never from Google Fonts. `next/font/local` fingerprints
 * them, emits the `<link rel="preload">` for the ones used above the fold, and generates a
 * metric-matched local fallback so swapping to the real face does not shift layout.
 *
 * Montserrat stands in for Gotham until the client confirms a web licence (content/facts.md).
 */
import localFont from "next/font/local";

/*
 * `display: "swap"`, not `"optional"`.
 *
 * `optional` was measured: it moved /courses and /book from 94 to 98 and left /calendar and
 * /enquire unchanged, which is the same size as the run-to-run variance on this machine. What it
 * costs is not variable: `optional` means a first-time visitor may never see Montserrat at all on
 * that visit, because the browser only swaps on a later navigation. Trading the brand typeface on
 * first paint for a Lighthouse point of uncertain provenance is not a trade worth making, and the
 * fallback is metric-matched either way so there is no layout shift in either direction.
 */

/**
 * Latin only, not Latin Extended.
 *
 * The two files were listed as two `src` entries with the same weight range and no `unicode-range`
 * between them, which a browser reads as two faces for the same descriptor and preloads both: 109KB
 * of Montserrat on the critical path of every page instead of 38KB. Lighthouse showed the three
 * font files arriving ahead of the text they were needed for, and LCP sitting at 3.4s while FCP was
 * 0.9s.
 *
 * The Latin Extended subset covers Central and Eastern European characters. This site is in English
 * and Indian English, its content comes from Sanity in English, and Latin-1 accents (é, à, ü) are
 * in the *latin* subset already. If a character outside it ever appears, the fallback stack renders
 * it; that is a better trade than 71KB on every first paint for a 64%-mobile Indian audience.
 */
export const montserrat = localFont({
  src: [
    { path: "../fonts/montserrat-latin-variable.woff2", weight: "100 900", style: "normal" },
  ],
  variable: "--font-montserrat",
  display: "swap",
  fallback: ["Helvetica Neue", "Arial", "sans-serif"],
  adjustFontFallback: "Arial",
  preload: true,
});

export const bebasNeue = localFont({
  src: [{ path: "../fonts/bebas-neue-latin-400.woff2", weight: "400", style: "normal" }],
  variable: "--font-bebas-neue",
  display: "swap",
  fallback: ["Impact", "Haettenschweiler", "sans-serif"],
  adjustFontFallback: "Arial",
  preload: true,
});
