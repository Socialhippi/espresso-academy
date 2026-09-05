/**
 * Turns Next's draft mode on for the Presentation tool.
 *
 * `defineEnableDraftMode` validates the request against Sanity before it flips the cookie, so an
 * unauthenticated visitor who guesses this URL gets nothing: without a valid Studio session or a
 * share secret the request is rejected and drafts stay private.
 */
import { defineEnableDraftMode } from "next-sanity/draft-mode";
import { previewClient } from "@/lib/sanity/client";

export const { GET } = defineEnableDraftMode({ client: previewClient });
