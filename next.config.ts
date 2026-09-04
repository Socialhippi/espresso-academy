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
  images: {
    // Only local files are served; no remote patterns are needed or allowed.
    formats: ["image/avif", "image/webp"],
  },
  // Trailing slashes off so the canonical URL and the served URL always match.
  trailingSlash: false,
  poweredByHeader: false,
};

export default nextConfig;
