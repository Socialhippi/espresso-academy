import { NextResponse } from "next/server";
import { featureFlags, halfConfigured } from "@/lib/env";
import { readClient } from "@/lib/sanity/client";

export const runtime = "nodejs";
/** Reads live state, so it can never be answered from a build. */
export const dynamic = "force-dynamic";

/**
 * Is this deployment actually working?
 *
 * Not a ping. A Next server answers 200 on every route long after the thing that makes the site
 * useful has stopped: this project has shipped a bot check nobody could pass, a Studio that could
 * not read its project id, and a mail sender that reached exactly one address, all while every
 * page returned 200. So this answers the question a smoke test should be asking — can the app
 * reach its content, and is anything configured on one side only.
 *
 * **Booleans and names, never values.** `featureFlags()` says what is switched on, `halfConfigured()`
 * names a pair with one half missing. No key, no token, no id.
 *
 * 503 when content is unreachable, because a site that cannot read its own courses is down whatever
 * its status line says. A half-configured integration is reported but does not fail the check: it
 * is a warning about one path, not the site being unavailable.
 */
export async function GET(): Promise<NextResponse> {
  const startedAt = Date.now();
  let content: "reachable" | "unreachable" = "unreachable";
  let detail: string | null = null;

  try {
    const count = await readClient.fetch<number>(`count(*[_type == "course"])`, {}, {
      // Never a cached answer: a health check that reports last hour's health is not one.
      cache: "no-store",
    });
    content = count > 0 ? "reachable" : "unreachable";
    if (count === 0) detail = "the dataset answered with no courses";
  } catch (error) {
    detail = error instanceof Error ? error.message : "unknown";
  }

  const warnings = halfConfigured();
  const ok = content === "reachable";

  return NextResponse.json(
    {
      ok,
      content,
      ...(detail ? { detail } : {}),
      flags: featureFlags(),
      ...(warnings.length > 0 ? { warnings } : {}),
      ms: Date.now() - startedAt,
    },
    {
      status: ok ? 200 : 503,
      headers: { "cache-control": "no-store" },
    },
  );
}
