"use client";

// Client: it mounts a third-party booking widget after the page is interactive.

import { useEffect, useRef, useState } from "react";
import { CalendarPlus } from "lucide-react";
import { ButtonLink } from "@/components/site/Button";

interface CalEmbedProps {
  /** From NEXT_PUBLIC_CALCOM_LINK, e.g. "espresso-academy/campus-visit". Undefined renders nothing. */
  link: string | undefined;
  className?: string;
}

/**
 * A Cal.com booking widget, loaded only when someone scrolls to it.
 *
 * Not an inline iframe on mount: Cal's embed is around 100KB of script and it would land in the
 * critical path of a thank-you page whose whole job is to say "we have your enquiry". An
 * IntersectionObserver defers it until it is on screen, and a link out is rendered underneath so
 * the page works with the script blocked, with JavaScript off, or with a Cal outage.
 */
export function CalEmbed({ link, className }: CalEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  /*
   * Initialised from the capability rather than set inside the effect: a browser with no
   * IntersectionObserver should show the embed, and doing that with a setState in the effect body
   * is a cascading render. `useState(fn)` runs once, on mount, and never during hydration on the
   * server, so the initial HTML is the same either way.
   */
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === "undefined");

  useEffect(() => {
    if (!link || visible) return;
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [link, visible]);

  if (!link) return null;

  const bookingUrl = `https://cal.com/${link.replace(/^https?:\/\/cal\.com\//, "")}`;

  return (
    <div ref={containerRef} className={className}>
      {visible ? (
        <iframe
          src={`${bookingUrl}?embed=true&theme=light`}
          title="Book a call with Espresso Academy India"
          loading="lazy"
          className="h-[600px] w-full border border-white-2"
        />
      ) : (
        // Reserves the height, so the page does not jump when the embed arrives. CLS budget is 0.05.
        <div className="h-[600px] w-full border border-white-2 bg-white-3" aria-hidden="true" />
      )}

      <p className="mt-4 type-small text-grey">
        Cannot see the calendar?{" "}
        <ButtonLink href={bookingUrl} variant="tertiary" size="inline" external>
          <CalendarPlus className="size-4" aria-hidden="true" />
          Open it in a new tab
        </ButtonLink>
      </p>
    </div>
  );
}
