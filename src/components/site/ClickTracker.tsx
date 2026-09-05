"use client";

// Client: one document-level listener, so no other component needs an onClick just to be measured.

import { useEffect } from "react";
import { track, type EventName } from "@/lib/analytics/events";

/**
 * Turns the `data-event` attributes the site already carries into typed events.
 *
 * Build 1 put `data-event="whatsapp_click_sticky"` and the like on every call to action and left
 * them unread, which was the right call: the alternative was an `onClick` on each one, which makes
 * every button a Client Component. This reads them from a single delegated listener instead. One
 * listener, no extra client boundaries, and the attributes stay where a developer can see them
 * next to the thing they describe.
 *
 * `closest` rather than `event.target`, because a click almost always lands on an icon or a span
 * inside the link, not on the element carrying the attribute.
 */

/** `whatsapp_click_sticky` becomes `whatsapp_click` fired from "sticky". */
function parse(raw: string): { name: EventName; location?: string } | null {
  const prefixes: [string, EventName][] = [
    ["whatsapp_click", "whatsapp_click"],
    ["call_click", "phone_click"],
    ["phone_click", "phone_click"],
    ["map_click", "map_click"],
    ["maps_click", "map_click"],
    ["faq_expand", "faq_expand"],
    ["course_filter", "course_filter"],
  ];

  for (const [prefix, name] of prefixes) {
    if (raw === prefix) return { name };
    if (raw.startsWith(`${prefix}_`)) return { name, location: raw.slice(prefix.length + 1) };
  }

  /*
   * Everything else is a call to action: book, enquire, reserve, pay, courses, calendar_download.
   * They keep their own id in `cta_id`, so a report can tell "book from the sticky bar" from "book
   * from a batch row" without this file needing a case for each.
   */
  return { name: "cta_click", location: raw };
}

export function ClickTracker() {
  useEffect(() => {
    const onClick = (event: MouseEvent): void => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const element = target.closest<HTMLElement>("[data-event]");
      const raw = element?.dataset.event;
      if (!element || !raw) return;

      const parsed = parse(raw);
      if (!parsed) return;

      track(parsed.name, {
        cta_id: raw,
        ...(parsed.location ? { location: parsed.location } : {}),
        ...(element.dataset.course ? { course_id: element.dataset.course } : {}),
      });
    };

    // Capture phase: a link that navigates away can unmount before a bubbled listener runs.
    document.addEventListener("click", onClick, { capture: true, passive: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
