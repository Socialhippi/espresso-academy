import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ButtonLink } from "@/components/site/Button";
import { LevelBadge } from "@/components/site/LevelBadge";
import { TbcPill } from "@/components/site/TbcPill";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { JsonLd } from "@/components/site/JsonLd";
import { PageHero } from "@/components/sections/Hero";
import { FinalCta } from "@/components/sections/FinalCta";
import { WaitlistInline } from "@/components/course/WaitlistInline";
import { BatchRow, BatchRowHeader } from "@/components/course/BatchRow";
import { CalendarFilters, type CalendarFacet } from "@/components/course/CalendarFilters";
import { getCourses, getNextInstances, getSiteSettings, type DatedInstance } from "@/lib/content";
import { formatMonthYear, isoDate, monthKey } from "@/lib/format";
import { absoluteUrl } from "@/lib/env";
import { pageMetadata } from "@/lib/seo/metadata";
import { graph, schemaIds, webPageNode } from "@/lib/seo/schema";

const DESCRIPTION =
  "Every scheduled barista and coffee course batch at the Bengaluru campus, grouped by month, with the dates and how to reserve a seat on each.";

export const metadata: Metadata = pageMetadata({
  title: "Course Calendar, Bengaluru",
  description: DESCRIPTION,
  path: "/calendar",
});

interface MonthGroup {
  key: string;
  label: string;
  entries: DatedInstance[];
}

function groupByMonth(entries: DatedInstance[]): MonthGroup[] {
  const groups = new Map<string, MonthGroup>();
  for (const entry of entries) {
    const key = monthKey(entry.startDate);
    const existing = groups.get(key);
    if (existing) existing.entries.push(entry);
    else groups.set(key, { key, label: formatMonthYear(entry.startDate), entries: [entry] });
  }
  return [...groups.values()].sort((a, b) => a.key.localeCompare(b.key));
}

/** Facets built from the batches that actually exist, so no chip ever leads to an empty list. */
function facetsFrom(entries: DatedInstance[]): { courses: CalendarFacet[]; venues: CalendarFacet[] } {
  const courses = new Map<string, CalendarFacet>();
  const venues = new Map<string, CalendarFacet>();

  for (const { course, instance } of entries) {
    const existingCourse = courses.get(course.slug);
    if (existingCourse) existingCourse.count += 1;
    else courses.set(course.slug, { value: course.slug, label: course.title, count: 1 });

    const venue = instance.venue;
    if (!venue) continue;
    const existingVenue = venues.get(venue.id);
    if (existingVenue) existingVenue.count += 1;
    else venues.set(venue.id, { value: venue.id, label: venue.name, count: 1 });
  }

  return {
    courses: [...courses.values()].sort((a, b) => a.label.localeCompare(b.label)),
    venues: [...venues.values()].sort((a, b) => a.label.localeCompare(b.label)),
  };
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  const settings = await getSiteSettings();
  const allDated = await getNextInstances();
  const courses = await getCourses();

  const params = await searchParams;
  const courseFilter = firstValue(params.course) ?? null;
  const venueFilter = firstValue(params.venue) ?? null;

  const facets = facetsFrom(allDated);
  /* Filtering happens after the facets are counted, so the counts describe the whole calendar
     rather than the current view: a chip reading "3" that shows 3 is more use than one reading
     the number you are already looking at. */
  const dated = allDated.filter(
    ({ course, instance }) =>
      (!courseFilter || course.slug === courseFilter) &&
      (!venueFilter || instance.venue?.id === venueFilter),
  );
  const months = groupByMonth(dated);
  const filtered = courseFilter !== null || venueFilter !== null;

  return (
    <>
      <PageHero
        above={<Breadcrumbs items={[{ label: "Calendar", href: "/calendar" }]} />}
        eyebrow="Calendar"
        title="Course dates in Bengaluru"
        intro={
          filtered ? (
            <p>
              Filtered. Clear the filters below to see every scheduled batch, soonest first.
            </p>
          ) : (
            <p>
              Every batch the academy has scheduled, soonest first. Dates are set a few weeks ahead,
              so the reliable way to catch the one you want is the batch alert rather than checking
              back.
            </p>
          )
        }
        actions={
          <ButtonLink href="/courses" variant="secondary">
            See all courses
          </ButtonLink>
        }
      />

      {months.length === 0 ? (
        <section className="section-y-sm" aria-labelledby="no-dates-heading">
          <Container>
            {/* TODO(client): every instance in content/data.ts is a tbc placeholder. */}
            <div className="border border-white-2 bg-white-3 p-6 md:p-10">
              <div className="flex flex-wrap items-center gap-3">
                <TbcPill label="Dates TBC" />
              </div>
              <h2 id="no-dates-heading" className="mt-4 type-h2 text-black">
                Batch dates are being finalised
              </h2>
              <p className="mt-4 measure type-body text-grey">
                No batch is published yet. Rather than list dates that might move, the academy
                announces each one when it is fixed. Pick the course you want below and leave your
                number: you will hear before it appears on this page.
              </p>
            </div>

            <div className="mt-12">
              <SectionHeading
                number="01"
                eyebrow="Batch alerts"
                title="Tell me when this one runs"
              />
              <ul className="mt-8 divide-y divide-white-2 border-y border-white-2">
                {courses.map((course) => (
                  <li key={course.slug}>
                    <details className="group">
                      <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
                        <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
                          <span className="type-h3 text-black">{course.title}</span>
                          <LevelBadge level={course.level} />
                        </span>
                        <span className="flex shrink-0 items-center gap-2 type-body text-red">
                          Get the alert
                          <ChevronDown
                            className="size-4 transition-transform duration-200 group-open:rotate-180"
                            aria-hidden="true"
                          />
                        </span>
                      </summary>
                      <div className="pb-6">
                        <WaitlistInline course={course.title} />
                        <p className="mt-4 type-small text-grey">
                          Or read{" "}
                          <Link
                            href={`/courses/${course.slug}`}
                            className="text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
                          >
                            what {course.title} covers
                          </Link>{" "}
                          first.
                        </p>
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </section>
      ) : (
        <section className="section-y-sm" aria-labelledby="calendar-heading">
          <Container>
            <h2 id="calendar-heading" className="sr-only">
              Scheduled batches by month
            </h2>

            <CalendarFilters
              courses={facets.courses}
              venues={facets.venues}
              activeCourse={courseFilter}
              activeVenue={venueFilter}
              className="mb-12"
            />

            {months.length === 0 && (
              /* Every filter combination that reaches here has at least one batch behind it, so
                 this only shows for a hand-typed query string. It still gets a way out. */
              <div className="border border-white-2 bg-white-3 p-6 md:p-8">
                <h3 className="type-h3 text-black">Nothing scheduled for that combination</h3>
                <p className="mt-3 measure type-body text-grey">
                  Clear the filters to see every batch, or tell the academy what you are after and
                  they will say when it next runs.
                </p>
                <div className="mt-6">
                  <ButtonLink href="/calendar" variant="secondary" size="sm">
                    Show every batch
                  </ButtonLink>
                </div>
              </div>
            )}
            {months.map((month, index) => (
              <div key={month.key} className={index > 0 ? "mt-14" : undefined}>
                <SectionHeading
                  number={String(index + 1).padStart(2, "0")}
                  eyebrow="Month"
                  title={month.label}
                />
                <div className="mt-6 table-scroll">
                  <table className="w-full min-w-2xl border-collapse text-left">
                    <caption className="sr-only">Batches starting in {month.label}</caption>
                    <thead>
                      <BatchRowHeader />
                    </thead>
                    <tbody>
                      {month.entries.map(({ course, instance }) => (
                        <BatchRow key={instance.id} course={course} instance={instance} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </Container>
        </section>
      )}

      <FinalCta
        number={months.length === 0 ? "02" : String(months.length + 1).padStart(2, "0")}
        title="Ask which batch suits you"
        body={
          <p>
            Tell the academy which days of the week you can attend and what you want to be able to
            do. They will tell you which batch to aim for as soon as it is set.
          </p>
        }
      />

      <JsonLd
        id="calendar-jsonld"
        data={graph([
          webPageNode("/calendar", "Course dates in Bengaluru", DESCRIPTION),
          /* Event nodes only exist once a batch has a real date. An Event without a startDate is
             invalid, and inventing one would be inventing a fact. */
          /* allDated, not the filtered view: the canonical is always /calendar (seo.md), so the
             structured data has to describe /calendar rather than whichever facet is on screen. */
          ...allDated.map(({ course, instance, startDate }) => ({
            "@type": "Event",
            "@id": absoluteUrl(`/calendar#${instance.id}`),
            name: `${course.title} at ${settings.name}`,
            startDate: isoDate(startDate),
            ...(instance.endDate ? { endDate: isoDate(instance.endDate) } : {}),
            eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
            eventStatus: "https://schema.org/EventScheduled",
            location: { "@id": schemaIds.PLACE_ID },
            organizer: { "@id": schemaIds.ORGANISATION_ID },
            url: absoluteUrl(`/courses/${course.slug}`),
          })),
        ])}
      />
    </>
  );
}
