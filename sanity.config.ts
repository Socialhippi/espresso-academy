/**
 * The Studio, mounted inside the Next application at /studio.
 *
 * Embedded rather than deployed separately so there is one deployment, one set of environment
 * variables and one origin to allow through the CSP. `sanity deploy` still publishes a copy at
 * <project>.sanity.studio for the academy, which is what the handover document links to.
 */
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { presentationTool } from "sanity/presentation";
import { visionTool } from "@sanity/vision";
import { apiVersion, dataset, projectId, studioPreviewOrigin } from "./sanity/env";
import { schemaTypes } from "./sanity/schemaTypes";
import { structure } from "./sanity/structure";

/** One settings document, and it is never created twice or deleted by accident. */
const SINGLETONS = new Set(["siteSettings"]);

/** A booking is a record of a payment. It is created by the server and never by hand. */
const SERVER_OWNED = new Set(["booking", "enquiry"]);

export default defineConfig({
  name: "default",
  title: "Espresso Academy India",
  projectId,
  dataset,
  basePath: "/studio",

  plugins: [
    structureTool({ structure }),
    presentationTool({
      previewUrl: {
        initial: studioPreviewOrigin,
        previewMode: { enable: "/api/draft-mode/enable" },
      },
    }),
    // Vision is a query console. Useful to the developer, noise to the academy: dev only.
    ...(process.env.NODE_ENV === "development" ? [visionTool({ defaultApiVersion: apiVersion })] : []),
  ],

  schema: {
    types: schemaTypes,
    // The singleton must not appear in the "create new" menu, or there will be two of it.
    templates: (prev) => prev.filter((template) => !SINGLETONS.has(template.schemaType)),
  },

  document: {
    newDocumentOptions: (prev) =>
      prev.filter(
        (item) => !SINGLETONS.has(item.templateId) && !SERVER_OWNED.has(item.templateId),
      ),
    actions: (prev, { schemaType }) =>
      SINGLETONS.has(schemaType)
        ? prev.filter(({ action }) => action !== "delete" && action !== "duplicate" && action !== "unpublish")
        : SERVER_OWNED.has(schemaType)
          ? prev.filter(({ action }) => action !== "duplicate")
          : prev,
  },
});
