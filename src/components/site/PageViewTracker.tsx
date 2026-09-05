"use client";

// Client: it reads the current route, which only the browser knows after a client-side navigation.

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics/events";

interface PageViewTrackerProps {
  /** Course slug to level, so a course page's view carries what it is about. */
  courseLevels: Record<string, string>;
}

/** What kind of page this is, from its path. One place, so a report can group by it. */
function pageTypeOf(pathname: string): string {
  if (pathname === "/") return "home";
  if (pathname === "/courses") return "course_hub";
  if (pathname.startsWith("/courses/")) return "course";
  if (pathname.startsWith("/guides/")) return "guide";
  if (pathname === "/guides") return "guide_hub";
  if (pathname.startsWith("/certifications/")) return "certification";
  if (pathname.startsWith("/trainers/")) return "trainer";
  if (pathname.startsWith("/book/")) return "checkout";
  if (pathname.startsWith("/booking/")) return "booking_confirmation";
  if (pathname.startsWith("/lp/")) return "landing_page";
  return pathname.replace(/^\//, "").replace(/\//g, "_") || "other";
}

/**
 * One `page_view` per navigation, including client-side ones.
 *
 * GTM's own history-change trigger would also catch these, but it fires without the page type, the
 * course or the level, and adding those in the container means the container has to know this
 * site's URL shapes. Doing it here keeps one definition of "what page is this" in the codebase
 * that also owns the routes.
 *
 * The ref guards React's double-invoke in development and a re-render from a changed prop: a
 * page_view fired twice is a doubled session count, and it is the one metric everybody checks.
 */
export function PageViewTracker({ courseLevels }: PageViewTrackerProps) {
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;

    const courseSlug = pathname.startsWith("/courses/")
      ? pathname.slice("/courses/".length)
      : undefined;

    track("page_view", {
      page_type: pageTypeOf(pathname),
      ...(courseSlug ? { course_id: courseSlug, level: courseLevels[courseSlug] } : {}),
    });

    if (courseSlug) {
      track("course_view", { course_id: courseSlug, level: courseLevels[courseSlug] });
    }
  }, [pathname, courseLevels]);

  return null;
}
