"use client";

// Client: it reacts to the current route, which a Server Component layout cannot read.

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { shouldShowSiteChrome } from "@/lib/nav";

/**
 * Hides the site header and footer on the routes that bring their own.
 *
 * Only `/lp/*` today. The alternative was a second root layout in a route group, which would mean
 * moving every existing route into `(site)/` to make one campaign page work; this is one small
 * component and it keeps the landmark rules intact, which is what actually matters: one `header`,
 * one `main`, one `footer`, on every route.
 *
 * `children` is rendered on the server and passed in, so the Header and Footer stay Server
 * Components and none of their content is pulled into the client bundle by this gate.
 */
export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (!shouldShowSiteChrome(pathname)) return null;
  return <>{children}</>;
}
