/**
 * CLI config, used by `pnpm sanity` (dataset export, schema deploy, studio deploy).
 * The Studio itself is served by Next at /studio; this file exists so the CLI knows which project
 * it is talking to without a flag on every command.
 */
import { defineCliConfig } from "sanity/cli";

/*
 * Bridge the two naming schemes before anything builds.
 *
 * The CLI runs in Node and can read `NEXT_PUBLIC_*` from .env.local, but the Studio bundle is
 * built by Vite, which exposes only `SANITY_STUDIO_*`. That gap is what shipped a hosted Studio
 * that crashed at boot on a variable it could never have been given. Copying the values across
 * here means `pnpm sanity:deploy` works from the environment the site already needs, and setting
 * the SANITY_STUDIO_ names explicitly still wins.
 */
process.env.SANITY_STUDIO_PROJECT_ID ||= process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
process.env.SANITY_STUDIO_DATASET ||= process.env.NEXT_PUBLIC_SANITY_DATASET;
process.env.SANITY_STUDIO_API_VERSION ||= process.env.NEXT_PUBLIC_SANITY_API_VERSION;
process.env.SANITY_STUDIO_SITE_URL ||= process.env.NEXT_PUBLIC_SITE_URL;

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET,
  },
  studioHost: "espresso-academy-india",
  deployment: { autoUpdates: true, appId: "mmqvy510nnb7vn4t1to9pcre" },
});
