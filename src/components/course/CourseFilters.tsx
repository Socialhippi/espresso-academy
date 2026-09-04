import Link from "next/link";
import { levelBadge, skillAreaLabel, type Level, type SkillArea } from "@/lib/content";
import { cn } from "@/lib/utils";

interface CourseFiltersProps {
  /** Levels that actually have a course, in ladder order. */
  levels: Level[];
  /** Skill areas that actually have a course. */
  skillAreas: SkillArea[];
  activeLevel?: Level | null;
  activeArea?: SkillArea | null;
  className?: string;
}

const chipClass =
  "inline-flex h-11 items-center rounded-xs border px-4 type-label transition-colors duration-200";

const activeClass = "border-red bg-red-tint text-black";
const restingClass = "border-white-2 bg-white text-grey hover:border-black hover:text-black";

/** Build a /courses URL with one facet changed and the other kept. */
function filterHref(level: Level | null, area: SkillArea | null): string {
  const params = new URLSearchParams();
  if (level) params.set("level", level);
  if (area) params.set("area", area);
  const query = params.toString();
  return query ? `/courses?${query}` : "/courses";
}

/**
 * Level and skill-area chips, synced to ?level= and ?area=.
 *
 * These are links, not buttons: the filtered view is rendered on the server, so it works with
 * JavaScript off, reads correctly to a screen reader without ARIA, and never flashes an unfiltered
 * list. Every filtered URL canonicalises back to /courses (.claude/rules/seo.md), so the facets
 * never compete with the hub in search.
 */
export function CourseFilters({
  levels,
  skillAreas,
  activeLevel = null,
  activeArea = null,
  className,
}: CourseFiltersProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div>
        {/* The heading carries the structure; the visible label carries the style. An H2 set at
            12px would be the smallest type on the page, which inverts the hierarchy. */}
        <h2 className="sr-only" id="filter-level">
          Filter by level
        </h2>
        <p aria-hidden="true" className="type-label text-grey">
          Filter by level
        </p>
        <ul aria-labelledby="filter-level" className="mt-3 flex flex-wrap gap-2">
          <li>
            <Link
              href={filterHref(null, activeArea)}
              aria-current={activeLevel === null ? "true" : undefined}
              className={cn(chipClass, activeLevel === null ? activeClass : restingClass)}
            >
              All levels
            </Link>
          </li>
          {levels.map((level) => {
            const active = activeLevel === level;
            return (
              <li key={level}>
                <Link
                  href={filterHref(active ? null : level, activeArea)}
                  aria-current={active ? "true" : undefined}
                  className={cn(chipClass, active ? activeClass : restingClass)}
                >
                  {levelBadge[level].label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <h2 className="sr-only" id="filter-area">
          Filter by skill area
        </h2>
        <p aria-hidden="true" className="type-label text-grey">
          Filter by skill area
        </p>
        <ul aria-labelledby="filter-area" className="mt-3 flex flex-wrap gap-2">
          <li>
            <Link
              href={filterHref(activeLevel, null)}
              aria-current={activeArea === null ? "true" : undefined}
              className={cn(chipClass, activeArea === null ? activeClass : restingClass)}
            >
              All areas
            </Link>
          </li>
          {skillAreas.map((area) => {
            const active = activeArea === area;
            return (
              <li key={area}>
                <Link
                  href={filterHref(activeLevel, active ? null : area)}
                  aria-current={active ? "true" : undefined}
                  className={cn(chipClass, active ? activeClass : restingClass)}
                >
                  {skillAreaLabel[area]}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
