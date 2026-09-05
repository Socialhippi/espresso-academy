/**
 * The site's analytics vocabulary, typed.
 *
 * One `track()` and one union of event names, so a mis-typed event is a build error rather than a
 * gap in a report nobody notices for a month. Nothing here knows about GTM: it pushes to
 * `dataLayer`, which is a plain array on `window`, and the container decides what to do with it.
 *
 * Three consequences worth stating:
 *
 * - `dataLayer` is created here whether or not GTM ever loads, so a push before the container is
 *   ready is queued rather than lost, and a site with no container id still runs without throwing.
 * - Nothing is sent to any third party from this file. The consent gate is on *loading* GTM
 *   (src/components/site/Analytics.tsx); until the reader has chosen, pushes accumulate in an
 *   array that goes nowhere.
 * - Server-side events (Meta CAPI) live in src/lib/meta/capi.ts and share an `event_id` with their
 *   browser twin so the pair is deduplicated.
 */

export type EventName =
  | "page_view"
  | "course_view"
  | "course_filter"
  | "batch_view"
  | "cta_click"
  | "whatsapp_click"
  | "phone_click"
  | "form_start"
  | "form_error"
  | "form_submit"
  | "generate_lead"
  | "waitlist_join"
  | "begin_checkout"
  | "add_payment_info"
  | "purchase"
  | "booking_failed"
  | "guide_read"
  | "faq_expand"
  | "map_click"
  | "consent_update";

/** Every parameter the site ever sends, so a name cannot be spelled two ways in two files. */
export interface EventParams {
  page_type?: string;
  course_id?: string;
  level?: string;
  instance_id?: string;
  cta_id?: string;
  location?: string;
  form_id?: string;
  reason?: string;
  filter_type?: string;
  filter_value?: string;
  guide_id?: string;
  question?: string;
  /** Rupees. An estimate on a lead, the real figure on a purchase. */
  value?: number;
  currency?: "INR";
  transaction_id?: string;
  items?: { item_id: string; item_name: string; price?: number; quantity: number }[];
  consent_analytics?: boolean;
  consent_marketing?: boolean;
  /** Shared with the server-side Meta event so the pair deduplicates. */
  event_id?: string;
}

interface DataLayerEvent extends EventParams {
  event: EventName;
}

/**
 * The `gtag` shim the consent-mode snippet defines in the document head.
 *
 * Variadic and positional by protocol: `gtag('consent', 'update', {...})` pushes its `arguments`
 * object onto the dataLayer, and GTM reads it by position. That is why this is typed as a rest
 * parameter rather than as a union of call shapes; narrowing it would be inventing a contract
 * Google does not have.
 */
type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: DataLayerEvent[];
    gtag?: Gtag;
  }
}

/** Server-side render, or a browser with scripting disabled: nothing to push to. */
function canPush(): boolean {
  return typeof window !== "undefined";
}

/**
 * Push one event.
 *
 * Never throws. An analytics call that can break a checkout is worse than a missing data point,
 * and this one sits inside a payment handler.
 */
export function track(event: EventName, params: EventParams = {}): void {
  if (!canPush()) return;
  try {
    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push({ event, ...params });
  } catch {
    // Deliberately silent. There is nowhere useful to report a failed analytics push to.
  }
}

/**
 * A stable id shared between a browser event and its server twin.
 *
 * Derived from something the two sides both know (a booking id, an enquiry id) rather than
 * random, because the whole point is that both sides produce the same string.
 */
export function eventId(prefix: string, key: string): string {
  return `${prefix}-${key}`;
}

/**
 * Fires `purchase` once per booking, ever, in this browser.
 *
 * The confirmation page is a URL a student can reload, bookmark or open twice from an email, and
 * each of those would otherwise report a second sale. sessionStorage is the right scope: it
 * survives a reload, and it does not survive so long that a genuinely new booking is suppressed.
 */
export function trackPurchaseOnce(bookingId: string, params: EventParams): void {
  if (!canPush()) return;
  const key = `purchase-tracked:${bookingId}`;
  try {
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
  } catch {
    // Private mode, or storage disabled. Fire anyway: a duplicated purchase in a report is a
    // smaller problem than a missing one, and Meta deduplicates on event_id regardless.
  }
  track("purchase", params);
}
