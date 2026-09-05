/**
 * Sanity publish webhook.
 *
 * A publish in the Studio should be on the site in seconds, not in an hour, so this turns a
 * webhook into `revalidateTag` calls. Two rules, both non-negotiables in CLAUDE.md:
 *
 * 11/12. The signature is verified before anything is read, and the handler is idempotent: it
 * only ever marks caches stale, so ten deliveries of the same event and one delivery have the
 * same effect.
 *
 * Without SANITY_REVALIDATE_SECRET the route answers 401 and logs. Content still refreshes on the
 * one-hour floor in src/lib/content.ts, so a misconfigured webhook is slow, not broken.
 */
import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "next-sanity/webhook";

/** Everything the webhook may name. An unknown type is logged and ignored, never trusted. */
const KNOWN_TYPES = new Set([
  "course",
  "courseInstance",
  "trainer",
  "certification",
  "faqItem",
  "story",
  "siteSettings",
  "guide",
  "page",
  "landingPage",
  "redirect",
  "venue",
]);

/**
 * A change to one of these changes what every course page renders, so the course tag goes stale
 * with them. A batch is the obvious case: it is fetched as part of the course.
 */
const ALSO_INVALIDATES: Record<string, string[]> = {
  courseInstance: ["course"],
  venue: ["courseInstance", "course"],
  trainer: ["course", "guide"],
  certification: ["course"],
};

interface WebhookBody {
  _id?: string;
  _type?: string;
  slug?: { current?: string } | string;
}

function slugOf(body: WebhookBody): string | undefined {
  if (typeof body.slug === "string") return body.slug;
  return body.slug?.current;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.SANITY_REVALIDATE_SECRET?.trim();
  if (!secret) {
    console.warn(JSON.stringify({ at: "revalidate", ok: false, reason: "no-secret" }));
    return NextResponse.json({ ok: false, reason: "not-configured" }, { status: 401 });
  }

  let parsed: Awaited<ReturnType<typeof parseBody<WebhookBody>>>;
  try {
    parsed = await parseBody<WebhookBody>(request, secret);
  } catch (error) {
    console.error(JSON.stringify({ at: "revalidate", ok: false, reason: "parse-failed", error: String(error) }));
    return NextResponse.json({ ok: false, reason: "bad-request" }, { status: 400 });
  }

  if (!parsed.isValidSignature) {
    console.warn(JSON.stringify({ at: "revalidate", ok: false, reason: "bad-signature" }));
    return NextResponse.json({ ok: false, reason: "invalid-signature" }, { status: 401 });
  }

  const body = parsed.body;
  const type = body?._type;
  if (!type || !KNOWN_TYPES.has(type)) {
    console.warn(JSON.stringify({ at: "revalidate", ok: false, reason: "unknown-type", type }));
    // 200, not 400: an unknown type is a schema that moved on, not an attack, and a non-2xx would
    // make Sanity retry a delivery that can never succeed.
    return NextResponse.json({ ok: true, revalidated: [] });
  }

  const slug = body ? slugOf(body) : undefined;
  const tags = new Set<string>([type, ...(ALSO_INVALIDATES[type] ?? [])]);
  if (slug) tags.add(`${type}:${slug}`);

  for (const tag of tags) {
    // "max" serves the stale copy while the new one is fetched, so a publish never costs a reader
    // a blocking round trip to Sanity.
    revalidateTag(tag, "max");
  }

  console.log(
    JSON.stringify({ at: "revalidate", ok: true, type, id: body?._id, tags: [...tags] }),
  );
  return NextResponse.json({ ok: true, revalidated: [...tags] });
}

/** A GET is almost always someone testing the URL by hand. Say so rather than 405-ing silently. */
export function GET(): NextResponse {
  return NextResponse.json(
    { ok: false, reason: "This endpoint accepts signed POSTs from Sanity only." },
    { status: 405 },
  );
}
