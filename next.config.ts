import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      /**
       * The shadcn CLI writes `import { cn } from "cn"` into every file in src/components/ui/,
       * which uses the merger's default theme. That merger reads this project's `text-body` and
       * `text-small` tokens as colours and deletes the real colour class next to them, so a
       * primary button loses `text-white`. Those files must not be hand-edited (CLAUDE.md rule 9),
       * so the package specifier is aliased instead: every `from "cn"` resolves to the merger
       * configured with the brand theme. See src/lib/cn.ts.
       */
      cn: "./src/lib/cn.ts",
    },
  },
  /*
   * `experimental.inlineCss` was tried and reverted. It removes the render-blocking stylesheet
   * request that Lighthouse costs at 130 to 150ms, but inlining the 12KB sheet into every document
   * loses the cross-page cache and measured slightly worse: FCP 0.9s to 1.0s, and the course page
   * dropped from 95 to 91.
   */
  images: {
    // Only local files are served; no remote patterns are needed or allowed.
    formats: ["image/avif", "image/webp"],
  },
  /**
   * Redirects come from Sanity so the academy can retire a URL without a developer, and they are
   * read here rather than in middleware because a redirect that runs at the edge on every request
   * costs every reader a little to serve the handful who followed an old link. The trade is that
   * a new redirect needs a rebuild; the runbook says so, and `/api/revalidate` triggers one.
   *
   * A failure here is deliberately not fatal: a site that will not build because a CMS was briefly
   * unreachable is a worse outcome than a site missing three redirects.
   */
  async redirects() {
    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
    const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
    const token = process.env.SANITY_API_READ_TOKEN;
    if (!projectId || !dataset) return [];

    const query = encodeURIComponent(
      '*[_type == "redirect" && defined(from) && defined(to)]{from, to, "permanent": coalesce(permanent, true)}',
    );
    const url = `https://${projectId}.apicdn.sanity.io/v2026-09-05/data/query/${dataset}?query=${query}`;

    try {
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error(`Sanity answered ${response.status}`);
      const body: { result?: { from: string; to: string; permanent: boolean }[] } =
        await response.json();
      return (body.result ?? []).map((rule) => ({
        source: rule.from,
        destination: rule.to,
        permanent: rule.permanent,
      }));
    } catch (error) {
      console.warn("[redirects] Could not read redirects from Sanity:", String(error));
      return [];
    }
  },
  // Trailing slashes off so the canonical URL and the served URL always match.
  trailingSlash: false,
  poweredByHeader: false,
  /**
   * While NEXT_PUBLIC_INDEXABLE is anything but "true", every response carries a noindex header.
   * The draft is on a public alias so the client can open it on a phone without a Vercel login,
   * which also means a crawler can reach it. robots.txt covers the well-behaved crawler; this
   * covers the one that followed a link straight to a page. Removing it is a launch step.
   */
  async headers() {
    if (process.env.NEXT_PUBLIC_INDEXABLE?.trim().toLowerCase() === "true") return [];
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
