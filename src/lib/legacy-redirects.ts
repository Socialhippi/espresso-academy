/**
 * The old espressoacademy.in, mapped onto this site.
 *
 * The old site is one hand-written page served by LiteSpeed — not WordPress, and not GoDaddy's
 * Websites + Marketing builder. It has no robots.txt, no sitemap.xml and no internal links at all:
 * "About / Courses / Team / Gallery / Location" are tab labels rendered by easyResponsiveTabs.js,
 * not anchors, so there are no in-page fragments to preserve either. A crawl finds three URLs and
 * they are all here.
 *
 * These are declared in code rather than in Sanity, unlike every other redirect on this site,
 * because they are a one-off migration fact rather than something the academy will ever edit, and
 * because they must survive the Sanity fetch below failing. A launch-day redirect that disappears
 * when a CMS is briefly unreachable is the wrong shape of dependency.
 *
 * None of this takes effect until espressoacademy.in resolves to Vercel. Until the DNS moves these
 * rules are inert, because the requests still land on LiteSpeed.
 */
export const LEGACY_REDIRECTS = [
  /* The old homepage is served at both / and /index.php, byte for byte. / needs no rule. */
  { source: "/index.php", destination: "/", statusCode: 301 },
  /* Where the old enquiry form sent people on success. /thank-you does the same job here. It is
     noindex (.claude/rules/seo.md), which is correct for a page nobody should arrive at cold. */
  { source: "/thankyou.php", destination: "/thank-you", statusCode: 301 },
] as const;

/*
 * `/form_submit.php` is deliberately absent, and this is the reasoning rather than an oversight.
 *
 * It was the old form's endpoint, not a page. It took name, email and phone over GET, so any
 * indexed or shared link to it carries a real person's contact details in the query string.
 *
 * It was first mapped to `/enquire?from=legacy-form`, on the assumption that a destination with
 * its own query would stop Next forwarding the incoming one. It does not: Next *merges* them, and
 * the rule emitted
 *   location: /enquire?name=Test%20Person&email=test%40example.com&phone=9999999999&from=legacy-form
 * which puts that data in a Location header, in the reader's address bar, in the `page_path` the
 * analytics layer reports, and in our access logs. A 404 leaves it in one server log line and
 * stops. An endpoint nobody can bookmark as a destination has no equity worth preserving, so the
 * 404 is the better answer and tests/e2e/legacy-redirects.spec.ts pins it.
 */
