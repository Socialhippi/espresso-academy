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

export const montserrat = localFont({
  src: [
    { path: "../fonts/montserrat-latin-variable.woff2", weight: "100 900", style: "normal" },
    { path: "../fonts/montserrat-latin-ext-variable.woff2", weight: "100 900", style: "normal" },
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
