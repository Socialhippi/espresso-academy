import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/seo/og";

export const alt = "Espresso Academy India, barista and coffee courses in Bengaluru";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** The default card, used by every route without one of its own. */
export default async function OpengraphImage() {
  return ogCard({
    eyebrow: "Coffee education",
    title: "Barista training in Bengaluru, the Florence way",
    subtitle: "Roasting, brewing, espresso and latte art, the Italian way.",
  });
}
