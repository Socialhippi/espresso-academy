import type { MetadataRoute } from "next";
import { absoluteUrl, siteUrl } from "@/lib/env";
import { isIndexable } from "@/lib/public-env";

/**
 * Everything is allowed, including the AI crawlers: this site wants to be quoted by an assistant
 * that a prospective student is asking about barista courses in Bengaluru. Only the API, the
 * component gallery and the post-submit page are held back.
 */
const disallow = ["/api/", "/dev/", "/thank-you"];

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
  // While the draft is public for client review, nothing is crawlable. The X-Robots-Tag header in
  // next.config.ts covers the case where a crawler reached a URL without reading robots.txt.
  if (!isIndexable) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

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
