/** Where a batch runs. One document today, the Bengaluru campus. */
import { defineField, defineType } from "sanity";

export const venue = defineType({
  name: "venue",
  title: "Venue",
  type: "document",
  fields: [
    defineField({ name: "name", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "address", type: "postalAddress", validation: (rule) => rule.required() }),
    defineField({ name: "city", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "mapsUrl", title: "Google Maps URL", type: "url" }),
    defineField({ name: "notes", type: "text", rows: 3 }),
  ],
  preview: { select: { title: "name", subtitle: "city" } },
});
