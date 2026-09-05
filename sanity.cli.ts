/**
 * CLI config, used by `pnpm sanity` (dataset export, schema deploy, studio deploy).
 * The Studio itself is served by Next at /studio; this file exists so the CLI knows which project
 * it is talking to without a flag on every command.
 */
import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  },
  studioHost: "espresso-academy-india",
  deployment: { autoUpdates: true, appId: "mmqvy510nnb7vn4t1to9pcre" },
});
