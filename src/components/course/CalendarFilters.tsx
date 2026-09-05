import Link from "next/link";
import { cn } from "@/lib/utils";

export interface CalendarFacet {
  value: string;
  label: string;
  /** How many scheduled batches this facet would show. Zero facets are not rendered. */
  count: number;
}

interface CalendarFiltersProps {
  courses: CalendarFacet[];
  venues: CalendarFacet[];
  activeCourse?: string | null;
  activeVenue?: string | null;
  className?: string;
}

const chipClass =
  "inline-flex h-11 items-center rounded-xs border px-4 type-label transition-[color,background-color,border-color] duration-200";
const activeClass = "border-red bg-red-tint text-black";
const restingClass = "border-white-2 bg-white text-grey hover:border-black hover:text-black";

function href(course: string | null, venue: string | null): string {
  const params = new URLSearchParams();
  if (course) params.set("course", course);
  if (venue) params.set("venue", venue);
  const query = params.toString();
  return query ? `/calendar?${query}` : "/calendar";
}

/**
 * Course and venue filters for the calendar.
 *
 * Links, not buttons, for the same reasons as the course hub's: the filtered view is rendered on
 * the server, it works with JavaScript off, it reads correctly without ARIA, and it never flashes
 * an unfiltered list. Every filtered URL canonicalises back to `/calendar`, so a facet never
 * competes with the page it filters.
 *
 * A facet with no scheduled batches is not rendered at all. A filter that leads to an empty list is
 * a worse experience than one fewer chip, and today, with no dates published, that means the whole
 * strip is absent rather than being eight chips that all lead nowhere.
 */
export function CalendarFilters({
  courses,
  venues,
  activeCourse = null,
  activeVenue = null,
  className,
}: CalendarFiltersProps) {
  const showVenues = venues.length > 1;
  if (courses.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div>
        <h2 className="sr-only" id="filter-course">
          Filter by course
        </h2>
        <p aria-hidden="true" className="type-label text-grey">
          Filter by course
        </p>
        <ul aria-labelledby="filter-course" className="mt-3 flex flex-wrap gap-2">
          <li>
            <Link
              href={href(null, activeVenue)}
              data-event="course_filter_calendar_all"
              aria-current={activeCourse === null ? "true" : undefined}
              className={cn(chipClass, activeCourse === null ? activeClass : restingClass)}
            >
              Every course
            </Link>
          </li>
          {courses.map((facet) => {
            const active = activeCourse === facet.value;
            return (
              <li key={facet.value}>
                <Link
                  href={href(active ? null : facet.value, activeVenue)}
                  data-event={`course_filter_calendar_${facet.value}`}
                  aria-current={active ? "true" : undefined}
                  className={cn(chipClass, active ? activeClass : restingClass)}
                >
                  {facet.label}
                  <span className="ml-2 text-grey">{facet.count}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* One venue is not a choice. The academy has a single campus today, so this whole block
          stays out of the way until a second one exists. */}
      {showVenues && (
        <div>
          <h2 className="sr-only" id="filter-venue">
            Filter by venue
          </h2>
          <p aria-hidden="true" className="type-label text-grey">
            Filter by venue
          </p>
          <ul aria-labelledby="filter-venue" className="mt-3 flex flex-wrap gap-2">
            <li>
              <Link
                href={href(activeCourse, null)}
                data-event="course_filter_venue_all"
                aria-current={activeVenue === null ? "true" : undefined}
                className={cn(chipClass, activeVenue === null ? activeClass : restingClass)}
              >
                Every venue
              </Link>
            </li>
            {venues.map((facet) => {
              const active = activeVenue === facet.value;
              return (
                <li key={facet.value}>
                  <Link
                    href={href(activeCourse, active ? null : facet.value)}
                    data-event={`course_filter_venue_${facet.value}`}
                    aria-current={active ? "true" : undefined}
                    className={cn(chipClass, active ? activeClass : restingClass)}
                  >
                    {facet.label}
                    <span className="ml-2 text-grey">{facet.count}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
