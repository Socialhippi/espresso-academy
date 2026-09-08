import { cn } from "@/lib/utils";
import { levelBadge, type Level } from "@/lib/content";

interface LevelBadgeProps {
  level: Level;
  className?: string;
}

/**
 * The only place the mustard and blue accents appear. design.md restricts them to level badges:
 * mustard takes black text, blue takes white.
 *
 * The lookup is guarded because `level` is typed but not trusted. It comes from a Sanity string
 * field, and the set of levels shrank from six to two when revision 2 of content/facts.md cut the
 * catalogue. A dataset that still holds a retired value used to take the whole page down with
 * "Cannot read properties of undefined" — the build failed on it, which is the good case; the bad
 * case is an editor typing a level into the Studio and a live course page 500ing. The unknown
 * value is shown as it is stored, on the neutral ground, which is legible and tells whoever sees
 * it what to fix.
 */
export function LevelBadge({ level, className }: LevelBadgeProps) {
  const badge = levelBadge[level] ?? { label: level, className: "bg-white-2 text-black" };
  return (
    <span
      className={cn(
        /* whitespace-nowrap: "IBC Advanced" wrapped inside the pill in the /courses fee table,
           rendering a 37px two-line badge beside 22px one-line ones. A pill that wraps is not a
           pill. */
        "inline-flex items-center whitespace-nowrap rounded-pill px-3 py-1 type-label",
        badge.className,
        className,
      )}
    >
      {badge.label}
    </span>
  );
}
