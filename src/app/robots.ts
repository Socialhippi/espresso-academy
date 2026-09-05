import type { MetadataRoute } from "next";
import { absoluteUrl, siteUrl } from "@/lib/env";

/**
 * Everything is allowed, including the AI crawlers: this site wants to be quoted by an assistant
 * that a prospective student is asking about barista courses in Bengaluru.
 *
 * What is held back: the API, the component gallery and the post-submit page, plus /book and
 * /booking, which are transactional and per-batch, /lp, which is a paid-campaign duplicate of a
 * course page, and /studio, which is the CMS. Each of those also says noindex in its own metadata:
 * robots.txt is the polite request, the header is the enforcement.
 *
 * **These rules do not change at launch. Only the header does.**
 *
 * This file used to serve `Disallow: /` while NEXT_PUBLIC_INDEXABLE was false, which was
 * self-defeating. Disallow governs *crawling*, not indexing: a crawler that obeys it never fetches
 * the page, so it never reads `X-Robots-Tag: noindex, nofollow` and never learns the page is meant
 * to stay out. Google is explicit that a URL blocked by robots.txt can still be indexed on the
 * strength of inbound links alone, listed with no description because the crawler was not allowed
 * to look. The two directives were working against each other: the block was the reason the
 * noindex could not do its job.
 *
 * Allowing the crawl is what makes the noindex effective. A crawler fetches, reads the header, and
 * drops the URL. That is also why launch is a one-line change to an environment variable rather
 * than a change to this file: by then every crawler has already been told, in the only way it can
 * hear, that these pages exist and are not to be listed.
 */
const disallow = [
  "/api/",
  "/dev/",
  "/studio",
  "/thank-you",
  "/book/",
  "/booking/",
  "/lp/",
];

const aiCrawlers = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "Bytespider",
  "Amazonbot",
  "meta-externalagent",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      ...aiCrawlers.map((userAgent) => ({ userAgent, allow: "/", disallow })),
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    // A bare hostname: the directive takes no scheme and no trailing slash.
    host: new URL(siteUrl).host,
  };
}
