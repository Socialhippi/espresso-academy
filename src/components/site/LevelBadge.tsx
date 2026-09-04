import { cn } from "@/lib/utils";
import { levelBadge, type Level } from "@/lib/content";

interface LevelBadgeProps {
  level: Level;
  className?: string;
}

/**
 * The only place the mustard, blue and purple accents appear. design.md restricts them to level
 * badges: mustard takes black text, blue and purple take white.
 */
export function LevelBadge({ level, className }: LevelBadgeProps) {
  const badge = levelBadge[level];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill px-3 py-1 type-label",
        badge.className,
        className,
      )}
    >
      {badge.label}
    </span>
  );
}
