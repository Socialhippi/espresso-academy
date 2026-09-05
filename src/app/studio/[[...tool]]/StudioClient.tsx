"use client";

/**
 * The client boundary the Studio needs.
 *
 * `sanity.config.ts` pulls in `sanity` and `@sanity/icons`, and both publish a `react-server`
 * export condition with a different (much smaller) surface than their browser build. Imported from
 * a Server Component the build resolves them under that condition and fails on exports that only
 * exist for the browser, for example `UsersIcon` and `swr`'s default export.
 *
 * Marking this file a Client Component resolves the whole config graph under the client
 * conditions, which is where a Studio belongs anyway: it is a single-page application, and nothing
 * in it renders on the server.
 */
import { NextStudio } from "next-sanity/studio";
import config from "../../../../sanity.config";

export function StudioClient() {
  return <NextStudio config={config} />;
}
