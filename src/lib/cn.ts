import { createCn } from "cn/config";

/**
 * The class merger, taught about this project's theme.
 *
 * Out of the box the merger only knows Tailwind's default scales. Our tokens add names it has
 * never seen, and it guesses wrong in a way that silently deletes classes:
 *
 *   cn("bg-red text-white h-12 text-body")  ->  "bg-red h-12 text-body"   // text-white gone
 *
 * because `text-body` looks like a colour, so it is treated as conflicting with `text-white`.
 * The same happened to `border-outline` against `border-black`, and to `rounded-pill` against
 * `rounded-none`. The visible result was every WhatsApp button rendering as black-on-black.
 *
 * The same trap catches the `type-*` utilities. Those are `@utility` blocks, not theme values, so
 * the merger cannot see them as font sizes at all: hand `type-h3` to a shadcn component whose base
 * carries `text-sm` and both survive, with CSS order deciding. Inside src/components/ui/ use the
 * `text-*` names below; `type-*` is for our own elements, where nothing competes.
 *
 * Registering the custom theme scales below makes the merger classify them correctly:
 * `text-body` is a font size, `border-outline` a border width, `rounded-pill` a radius. Any token
 * added to `@theme` in globals.css under one of these namespaces belongs in the matching list.
 */
export const cn = createCn({
  extend: {
    theme: {
      // --text-* in globals.css. Font sizes, not colours.
      text: [
        "display",
        "display-lg",
        "h1",
        "h1-lg",
        "h2",
        "h2-lg",
        "h3",
        "h3-lg",
        "body",
        "body-lg",
        "small",
        "label",
      ],
      // --radius-*: the brand's 4px, 8px and 999px steps.
      radius: ["xs", "sm", "pill"],
      // --aspect-*: the 3:2 and 4:5 photo frames.
      aspect: ["photo", "portrait", "wide"],
      // --ease-*
      ease: ["out-brand"],
    },
    classGroups: {
      // The 1.5px secondary-button outline, defined as a @utility in globals.css.
      "border-w": [{ border: ["outline"] }],
    },
  },
});
