import { type NextRequest, NextResponse } from "next/server";
import { consentModeHash } from "@/lib/analytics/consent-mode";

/**
 * Security headers, with a nonce-based Content Security Policy.
 *
 * A nonce rather than `unsafe-inline`: this site has three inline scripts it genuinely needs (the
 * consent-mode snippet, the GTM loader and the Meta Pixel), and `unsafe-inline` to allow those
 * would allow every other one too, which is the whole attack. A fresh nonce per request means the
 * three the application emits run and an injected fourth does not.
 *
 * `strict-dynamic` is what makes that workable in practice. GTM's job is to inject more scripts,
 * and enumerating every host a container might ever load would be a list that goes stale the first
 * time the academy adds a tag. `strict-dynamic` says: a script this nonce trusted may load others.
 * Modern browsers then ignore the host allow-list, which is left in place only for the older ones.
 */

/** Origins the browser genuinely has to reach. Every entry is here for a named reason. */
const CSP_SOURCES = {
  // GTM and GA4; Google Fonts is absent on purpose, the fonts are self-hosted.
  google: ["https://www.googletagmanager.com", "https://www.google-analytics.com", "https://*.google-analytics.com", "https://*.analytics.google.com"],
  googleAds: ["https://www.googleadservices.com", "https://googleads.g.doubleclick.net", "https://www.google.com", "https://www.google.co.in"],
  meta: ["https://connect.facebook.net", "https://www.facebook.com"],
  razorpay: ["https://checkout.razorpay.com", "https://api.razorpay.com", "https://*.razorpay.com"],
  turnstile: ["https://challenges.cloudflare.com"],
  sanity: ["https://cdn.sanity.io", "https://*.api.sanity.io", "https://*.apicdn.sanity.io"],
  // The Studio's own fonts, icons, stylesheets and the bridge script that keeps it up to date.
  // None of these are on the content CDN, and none are reachable from a public page.
  sanityStatic: [
    "https://design-system-static.sanity.io",
    "https://*.sanity.io",
    "https://core.sanity-cdn.com",
    "https://*.sanity-cdn.com",
  ],
  calcom: ["https://cal.com", "https://*.cal.com"],
};

/**
 * Routes that collect something worth stealing: a name, a phone number, an email address, or a
 * payment. These get the strict policy and are rendered per request so they can carry a nonce.
 *
 * The split exists because of a real conflict, not a preference. A statically generated page's HTML
 * is written once at build time, so it cannot carry a per-request nonce; and `strict-dynamic` makes
 * a browser ignore `'self'` for inline code, so Next's own flight payload is blocked without one.
 * The choice is therefore: every page dynamic and nonced, or the static pages keep `unsafe-inline`.
 *
 * Making all 32 routes dynamic would put two Sanity round trips in front of every page view and
 * make the Lighthouse budget in CLAUDE.md unreachable, on a 64%-mobile Indian audience. So the line
 * is drawn at input: a page that takes personal data gets the strict policy, a page that only
 * displays content stays static. The marketing pages render no user-controlled HTML at all —
 * everything from Sanity goes through React's escaping, and the only `dangerouslySetInnerHTML` on
 * the site holds two compile-time constants — so `unsafe-inline` there grants nothing an attacker
 * has a way to reach.
 */
const STRICT_PREFIXES = ["/enquire", "/contact", "/book", "/booking", "/for-cafes", "/lp", "/api"];

function needsStrictCsp(pathname: string): boolean {
  return STRICT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * The strict policy, for routes that take input: nonce plus `strict-dynamic`, no `unsafe-*`.
 */
async function publicCsp(nonce: string, secure: boolean): Promise<string> {
  const scriptSrc: string[] = [
    "'self'",
    /*
     * The nonce is for Next's own inline scripts, not for anything this codebase writes.
     *
     * Next reads the policy off the request header below and stamps this nonce onto the flight
     * payload it emits. Without it those scripts are blocked, because `strict-dynamic` makes a
     * browser ignore `'self'` for inline code. The application never reads the nonce back: doing
     * that means `headers()` in the root layout, which makes every page on the site dynamic.
     */
    `'nonce-${nonce}'`,
    /*
     * The consent-mode snippet, trusted by hash. See src/lib/analytics/consent-mode.ts for why a
     * hash rather than a nonce: a nonce would have to be read in the root layout, and reading a
     * header there makes every page on the site dynamic.
     *
     * Next's own inline scripts are nonced automatically from the CSP request header set below, and
     * GTM and the Meta Pixel are injected by already-trusted code, which `strict-dynamic` allows.
     */
    await consentModeHash(),
    "'strict-dynamic'",
    // Ignored by browsers that understand strict-dynamic; the fallback for those that do not.
    "https:",
    ...CSP_SOURCES.google,
    ...CSP_SOURCES.googleAds,
    ...CSP_SOURCES.meta,
    ...CSP_SOURCES.razorpay,
    ...CSP_SOURCES.turnstile,
  ];

  return serialise({
    "default-src": ["'self'"],
    "script-src": scriptSrc,
    /*
     * Styles stay `unsafe-inline`. Next injects its critical CSS as an inline <style> with no
     * nonce and no supported way to add one. A style injection cannot execute code; it is a
     * defacement risk rather than a data-exfiltration one, so this is the single relaxation taken.
     */
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", ...CSP_SOURCES.sanity, ...CSP_SOURCES.google, ...CSP_SOURCES.meta],
    "font-src": ["'self'", "data:"],
    "connect-src": [
      "'self'",
      ...CSP_SOURCES.google,
      ...CSP_SOURCES.googleAds,
      ...CSP_SOURCES.meta,
      ...CSP_SOURCES.razorpay,
      ...CSP_SOURCES.turnstile,
      ...CSP_SOURCES.sanity,
    ],
    "frame-src": [
      "'self'",
      ...CSP_SOURCES.razorpay,
      ...CSP_SOURCES.turnstile,
      ...CSP_SOURCES.google,
      ...CSP_SOURCES.meta,
      ...CSP_SOURCES.calcom,
    ],
    "worker-src": ["'self'", "blob:"],
    "form-action": ["'self'"],
    // Nothing on this site should ever be framed: it takes payments and personal data.
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "object-src": ["'none'"],
    ...upgradeInsecure(secure),
  });
}

/**
 * The Studio's policy. A genuinely different one, not the public policy with additions.
 *
 * **`strict-dynamic` and `unsafe-inline` cannot coexist.** When `strict-dynamic` is present a
 * browser *ignores* `unsafe-inline`, `self` and every host source in `script-src` — which is the
 * point of it, and which meant the first version of this file emitted a policy that read as if it
 * allowed the Studio's inline scripts and blocked all 40-odd of them. A header assertion could not
 * see that; `scripts/check-csp.mjs` loads the pages and reads the console, which could.
 *
 * So the Studio gets `unsafe-inline` and `unsafe-eval` with no `strict-dynamic`: it is a
 * third-party application this site hosts rather than one it wrote, it compiles schemas in the
 * browser, and it is behind a Sanity login. Scoping this to /studio is what keeps it off every
 * page a member of the public can reach, and there is a test asserting exactly that.
 */
function studioCsp(secure: boolean): string {
  return serialise({
    "default-src": ["'self'"],
    // sanityStatic as well as sanity: the bridge script that keeps an auto-updating Studio current
    // is served from core.sanity-cdn.com, not from the content CDN.
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      "blob:",
      ...CSP_SOURCES.sanity,
      ...CSP_SOURCES.sanityStatic,
    ],
    "style-src": ["'self'", "'unsafe-inline'", ...CSP_SOURCES.sanityStatic],
    "img-src": ["'self'", "data:", "blob:", ...CSP_SOURCES.sanity, ...CSP_SOURCES.sanityStatic],
    // The Studio serves its own typeface from Sanity's static host.
    "font-src": ["'self'", "data:", ...CSP_SOURCES.sanityStatic],
    "connect-src": [
      "'self'",
      ...CSP_SOURCES.sanity,
      ...CSP_SOURCES.sanityStatic,
      // Real-time editing is a websocket to the Content Lake.
      "wss://*.api.sanity.io",
      "https://*.sanity.io",
    ],
    "frame-src": ["'self'", "https://*.sanity.io"],
    "worker-src": ["'self'", "blob:"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "object-src": ["'none'"],
    ...upgradeInsecure(secure),
  });
}

/**
 * The policy for the static content pages.
 *
 * `unsafe-inline` for the framework's flight payload, and deliberately **no** `strict-dynamic`,
 * because the two cancel: a browser that honours `strict-dynamic` ignores `unsafe-inline`. So the
 * host allow-list does the work here instead. Everything else is identical to the strict policy,
 * including `object-src 'none'`, `base-uri 'self'` and `frame-ancestors 'none'`.
 */
function contentCsp(secure: boolean): string {
  return serialise({
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      /*
       * `unsafe-inline` and nothing else that is inline-ish. No hash and no nonce here on purpose:
       * the CSP spec says a browser ignores `unsafe-inline` the moment a hash-source or
       * nonce-source is present, so adding the consent-snippet hash "for good measure" silently
       * turned this policy back into one that blocked every inline script. `unsafe-inline` already
       * covers that snippet.
       */
      "'unsafe-inline'",
      ...CSP_SOURCES.google,
      ...CSP_SOURCES.googleAds,
      ...CSP_SOURCES.meta,
      ...CSP_SOURCES.razorpay,
      ...CSP_SOURCES.turnstile,
    ],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", ...CSP_SOURCES.sanity, ...CSP_SOURCES.google, ...CSP_SOURCES.meta],
    "font-src": ["'self'", "data:"],
    "connect-src": [
      "'self'",
      ...CSP_SOURCES.google,
      ...CSP_SOURCES.googleAds,
      ...CSP_SOURCES.meta,
      ...CSP_SOURCES.razorpay,
      ...CSP_SOURCES.turnstile,
      ...CSP_SOURCES.sanity,
    ],
    "frame-src": [
      "'self'",
      ...CSP_SOURCES.razorpay,
      ...CSP_SOURCES.turnstile,
      ...CSP_SOURCES.google,
      ...CSP_SOURCES.meta,
      ...CSP_SOURCES.calcom,
    ],
    "worker-src": ["'self'", "blob:"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "object-src": ["'none'"],
    ...upgradeInsecure(secure),
  });
}

/**
 * `upgrade-insecure-requests`, but only over HTTPS.
 *
 * The directive tells the browser to rewrite every `http://` subresource to `https://`. On an
 * `http://localhost` origin that means rewriting the site's own stylesheets and images to an
 * origin with no TLS, and they all fail to load: WebKit does exactly that, while Chromium quietly
 * exempts localhost. The result was a site with no CSS in Safari and on iPad, which showed up as
 * 240px of horizontal overflow on 152 tests and looked like a layout bug.
 *
 * It is meaningless on an http origin anyway, so it is emitted only when the request is secure.
 */
function upgradeInsecure(secure: boolean): Record<string, string[]> {
  return secure ? { "upgrade-insecure-requests": [] } : {};
}

function serialise(directives: Record<string, string[]>): string {
  return Object.entries(directives)
    .map(([name, values]) => (values.length > 0 ? `${name} ${values.join(" ")}` : name))
    .join("; ");
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const isStudio = request.nextUrl.pathname.startsWith("/studio");
  /*
   * Behind Vercel the connection to the function is http, so the forwarded header is what says
   * whether the *browser* is on https. Locally there is no such header and the protocol is http,
   * which is the case that matters here.
   */
  const secure =
    request.headers.get("x-forwarded-proto") === "https" || request.nextUrl.protocol === "https:";
  /* Per request, and never reused: a reused nonce is no nonce. */
  const nonce = btoa(crypto.randomUUID());
  const csp = isStudio
    ? studioCsp(secure)
    : needsStrictCsp(request.nextUrl.pathname)
      ? await publicCsp(nonce, secure)
      : contentCsp(secure);

  /*
   * The policy goes on the *request* headers as well as the response. Next reads it there and
   * nonces its own inline scripts automatically, which is what keeps the framework's flight payload
   * running under a policy with no `unsafe-inline`.
   */
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  response.headers.set("content-security-policy", csp);
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  response.headers.set("x-frame-options", "DENY");
  /*
   * Permissions policy: deny the capabilities this site has no use for. `payment=()` is deliberate
   * even though the site takes payments: Razorpay Checkout runs in its own frame on its own origin
   * and uses its own policy, so the Payment Request API is not needed here.
   */
  response.headers.set(
    "permissions-policy",
    "camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=(), browsing-topics=()",
  );

  /*
   * HSTS is commented out until launch, on purpose.
   *
   * A wrong HSTS header is cached by every browser that saw it for the whole max-age and cannot be
   * withdrawn. Turning it on before the custom domain is attached and serving HTTPS correctly would
   * mean a two-year commitment made on a preview alias. docs/RUNBOOK.md lists this as a launch step.
   */
  // response.headers.set(
  //   "strict-transport-security",
  //   "max-age=63072000; includeSubDomains; preload",
  // );

  return response;
}

export const config = {
  /*
   * Everything except static assets and the image optimiser. A CSP on a font file is pure overhead:
   * the header is only meaningful on a document, and these run on every request.
   */
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|logo/|images/).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
