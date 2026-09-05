import "server-only";

/**
 * A fixed-window rate limiter held in the process's memory.
 *
 * **What this is not.** On Vercel each serverless instance has its own memory, so the real limit is
 * roughly `limit × instances` rather than `limit`. That is a deliberate trade for this site: the
 * traffic is a few hundred enquiries a month, the honeypot and the two-second time floor already
 * stop the scripted case, and Turnstile stops most of the rest. A shared store (Upstash, Vercel KV)
 * is the fix if the academy ever needs a hard limit, and it is one file away: the callers only see
 * `check()`.
 *
 * What it does buy, today: a single client cannot hammer `/api/orders` from one connection and
 * create a hundred Razorpay orders, and a burst against the webhook cannot pin one instance.
 */

interface Bucket {
  count: number;
  /** Epoch ms when this window ends. */
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Windows are short, so an entry is only interesting for a minute. Sweep on write. */
function sweep(now: number): void {
  if (buckets.size < 500) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  /** Requests left in this window. */
  remaining: number;
  /** Seconds until the window resets, for a Retry-After header. */
  retryAfterSeconds: number;
}

/**
 * @param key    Something stable per client, usually the IP plus the route name.
 * @param limit  Requests allowed per window.
 * @param windowMs Window length in milliseconds.
 */
export function check(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }

  existing.count += 1;
  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  if (existing.count > limit) {
    return { ok: false, remaining: 0, retryAfterSeconds };
  }
  return { ok: true, remaining: limit - existing.count, retryAfterSeconds };
}

/**
 * The client's address as the platform reports it.
 *
 * `x-forwarded-for` is only trustworthy because Vercel overwrites it at the edge; behind a proxy
 * that does not, this would be spoofable. "unknown" is a real bucket rather than a bypass: a
 * request with no address still counts against a shared quota.
 */
export function clientKey(request: Request, scope: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return `${scope}:${ip}`;
}

/** Clears every bucket. Tests only. */
export function reset(): void {
  buckets.clear();
}
