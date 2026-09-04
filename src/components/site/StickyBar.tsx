"use client";

// Client: reacts to scroll position and to the current route.

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Phone } from "lucide-react";
import { WhatsAppGlyph } from "@/components/site/WhatsAppGlyph";
import { shouldShowStickyBar } from "@/lib/nav";
import { siteSettings } from "@/lib/content";
import { telHref, whatsappUrl } from "@/lib/format";
import { cn } from "@/lib/utils";

/** The fee and next-batch line shown above the bar on a course page. */
export interface CourseBarEntry {
  title: string;
  feeLabel: string;
  nextDateLabel: string;
}

interface StickyBarProps {
  /**
   * Course slug to its fee and next-batch labels. Passed down from the server layout because a
   * client component cannot read content/data.ts at request time without shipping it twice.
   */
  courseBar: Record<string, CourseBarEntry>;
}

const SHOW_AFTER_PX = 300;

const segmentClass =
  "flex h-16 flex-1 flex-col items-center justify-center gap-1 type-label transition-colors duration-200";

/**
 * Mobile-only bottom bar: WhatsApp, Call, and a contextual third action. Appears once the header
 * has scrolled away and hides again when the reader scrolls back up past it.
 */
export function StickyBar({ courseBar }: StickyBarProps) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = (): void => {
      frame = 0;
      setVisible(window.scrollY > SHOW_AFTER_PX);
    };
    const onScroll = (): void => {
      if (frame === 0) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, []);

  if (!shouldShowStickyBar(pathname)) return null;

  const courseSlug = pathname.startsWith("/courses/") ? pathname.slice("/courses/".length) : null;
  const course = courseSlug ? courseBar[courseSlug] : undefined;

  return (
    <div
      data-testid="sticky-bar"
      data-visible={visible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 shadow-sm transition-transform duration-200 ease-out-brand md:hidden",
        visible ? "translate-y-0" : "translate-y-full",
      )}
      // Hidden from assistive tech and from tab order while it is off-screen.
      aria-hidden={!visible}
      inert={!visible}
    >
      {course && (
        <p className="flex items-center justify-between gap-3 border-t border-white-2 bg-white-3 px-5 py-2 type-small text-grey">
          <span className="truncate">
            <span className="text-black">{course.feeLabel}</span>
          </span>
          <span className="shrink-0 truncate">
            Next batch: <span className="text-black">{course.nextDateLabel}</span>
          </span>
        </p>
      )}

      <div className="flex border-t border-black-2">
        <a
          href={whatsappUrl(course ? { course: course.title } : {})}
          target="_blank"
          rel="noopener noreferrer"
          data-event="whatsapp_click_sticky"
          className={cn(segmentClass, "bg-black text-white")}
        >
          <WhatsAppGlyph className="size-5" />
          WhatsApp
        </a>

        <a
          href={telHref(siteSettings.phonePrimary)}
          data-event="call_click_sticky"
          className={cn(segmentClass, "border-x border-white-2 bg-white text-black")}
        >
          <Phone className="size-5" aria-hidden="true" />
          Call
        </a>

        {courseSlug ? (
          <Link
            href={`/enquire?course=${courseSlug}`}
            data-event="reserve_click_sticky"
            className={cn(segmentClass, "bg-red text-white")}
          >
            <ArrowRight className="size-5" aria-hidden="true" />
            Reserve
          </Link>
        ) : (
          <Link
            href="/courses"
            data-event="courses_click_sticky"
            className={cn(segmentClass, "bg-red text-white")}
          >
            <ArrowRight className="size-5" aria-hidden="true" />
            Courses
          </Link>
        )}
      </div>
    </div>
  );
}
