"use client";

// Client: it observes how far down the article the reader actually got.

import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics/events";

/**
 * Fires `guide_read` when the reader reaches the end of a guide.
 *
 * Not on page view. A guide's job is to be read, and a page_view already says the page loaded; the
 * useful signal is whether anybody got to the bottom, because that is what separates a guide that
 * answers the question from one that ranks for it and disappoints.
 *
 * An IntersectionObserver on a sentinel at the end of the body, fired once. The alternative,
 * scroll-depth percentages on a listener, costs a handler on every scroll frame for a number that
 * is less honest: 75% of a long guide is a different amount of reading than 75% of a short one.
 */
export function GuideReadTracker({ guideId }: { guideId: string }) {
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = sentinel.current;
    if (!element || typeof IntersectionObserver === "undefined") return;

    let fired = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (fired || !entries.some((entry) => entry.isIntersecting)) return;
        fired = true;
        track("guide_read", { guide_id: guideId });
        observer.disconnect();
      },
      { rootMargin: "0px 0px -20% 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [guideId]);

  return <div ref={sentinel} aria-hidden="true" />;
}
