import "server-only";

/**
 * Meta Conversions API, server side.
 *
 * Why it exists alongside the browser pixel: a browser event is lost to an ad blocker, to ITP, or
 * to a student who closes the tab the moment the payment window says "success". The server sees
 * the payment either way. Both send the same `event_id`, and Meta deduplicates on it, so an event
 * that arrives twice is counted once.
 *
 * No-ops without `META_CAPI_ACCESS_TOKEN`. Every function returns rather than throws: an
 * analytics call must never be the reason a booking is reported as failed.
 *
 * Personal data is hashed before it leaves this process, which is Meta's requirement and also the
 * right default: the academy's students did not agree to have their email addresses sent anywhere
 * in the clear.
 */
import { createHash } from "node:crypto";

const GRAPH_VERSION = "v21.0";

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function isCapiConfigured(): boolean {
  return Boolean(env("META_CAPI_ACCESS_TOKEN") && pixelId());
}

function pixelId(): string | undefined {
  return env("META_PIXEL_ID") ?? env("NEXT_PUBLIC_META_PIXEL_ID");
}

/** Meta wants lower-cased, trimmed, SHA-256 hex. */
function hash(value: string | null | undefined): string | undefined {
  const normalised = value?.trim().toLowerCase();
  if (!normalised) return undefined;
  return createHash("sha256").update(normalised).digest("hex");
}

/** Phone numbers hash as digits only, with the country code and no punctuation. */
function hashPhone(value: string | null | undefined): string | undefined {
  const digits = value?.replace(/\D/g, "");
  if (!digits) return undefined;
  return createHash("sha256").update(digits).digest("hex");
}

export interface CapiEventInput {
  eventName: "Purchase" | "Lead" | "InitiateCheckout" | "ViewContent" | "PageView";
  /** Shared with the browser pixel so Meta deduplicates the pair. */
  eventId: string;
  email?: string | null;
  phone?: string | null;
  /** Meta's browser cookies, when the caller has them. */
  fbp?: string | null;
  fbc?: string | null;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  sourceUrl?: string;
  value?: number;
  currency?: string;
  contentName?: string;
  contentId?: string;
}

export type CapiResult =
  | { sent: true }
  | { sent: false; reason: "not-configured" | "request-failed"; error?: string };

export async function sendCapiEvent(input: CapiEventInput): Promise<CapiResult> {
  const token = env("META_CAPI_ACCESS_TOKEN");
  const id = pixelId();
  if (!token || !id) return { sent: false, reason: "not-configured" };

  const userData: Record<string, unknown> = {};
  const email = hash(input.email);
  const phone = hashPhone(input.phone);
  if (email) userData.em = [email];
  if (phone) userData.ph = [phone];
  if (input.fbp) userData.fbp = input.fbp;
  if (input.fbc) userData.fbc = input.fbc;
  if (input.clientIpAddress) userData.client_ip_address = input.clientIpAddress;
  if (input.clientUserAgent) userData.client_user_agent = input.clientUserAgent;

  const customData: Record<string, unknown> = {};
  if (typeof input.value === "number") customData.value = input.value;
  if (input.currency) customData.currency = input.currency;
  if (input.contentName) customData.content_name = input.contentName;
  if (input.contentId) {
    customData.content_ids = [input.contentId];
    customData.content_type = "product";
  }

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: input.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: "website",
        ...(input.sourceUrl ? { event_source_url: input.sourceUrl } : {}),
        user_data: userData,
        ...(Object.keys(customData).length > 0 ? { custom_data: customData } : {}),
      },
    ],
  };

  // Set while testing so events land in Meta's Test Events tab rather than in the live dataset.
  const testCode = env("META_TEST_EVENT_CODE");
  if (testCode) body.test_event_code = testCode;

  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${id}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.warn(
        JSON.stringify({
          at: "meta/capi",
          event: "rejected",
          eventName: input.eventName,
          status: response.status,
          body: text.slice(0, 300),
        }),
      );
      return { sent: false, reason: "request-failed", error: `HTTP ${response.status}` };
    }

    console.log(
      JSON.stringify({ at: "meta/capi", event: "sent", eventName: input.eventName, eventId: input.eventId }),
    );
    return { sent: true };
  } catch (error) {
    console.warn(
      JSON.stringify({ at: "meta/capi", event: "failed", error: String(error) }),
    );
    return { sent: false, reason: "request-failed", error: String(error) };
  }
}

/** A paid booking. Called from the Razorpay webhook, where the payment is known to be real. */
export async function trackPurchase(input: {
  eventId: string;
  email?: string | null;
  phone?: string | null;
  value: number;
  currency: string;
  contentName?: string;
  contentId?: string;
  sourceUrl?: string;
}): Promise<CapiResult> {
  return sendCapiEvent({ eventName: "Purchase", ...input });
}

/** A submitted enquiry. Called from /api/enquiry once the Sanity write has succeeded. */
export async function trackLead(input: {
  eventId: string;
  email?: string | null;
  phone?: string | null;
  contentName?: string;
  contentId?: string;
  sourceUrl?: string;
  /** An estimate, so Meta can optimise towards the leads that are worth more. */
  value?: number;
  currency?: string;
  fbp?: string | null;
  fbc?: string | null;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
}): Promise<CapiResult> {
  return sendCapiEvent({ eventName: "Lead", ...input });
}
