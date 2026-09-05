/**
 * The Studio, served by this application at /studio.
 *
 * The page itself stays a Server Component so it can export `metadata`, `viewport` and `dynamic`;
 * the Studio and its config live behind the client boundary in StudioClient. `force-static`
 * because there is nothing to render per request: making it dynamic would put a server round trip
 * in front of every editor's first paint.
 *
 * noindex, and excluded from the sitemap and from robots.
 */
import type { Metadata } from "next";
import { StudioClient } from "./StudioClient";

export const dynamic = "force-static";

export { viewport } from "next-sanity/studio";

export const metadata: Metadata = {
  title: "Studio",
  robots: { index: false, follow: false },
};

export default function StudioPage() {
  return <StudioClient />;
}
