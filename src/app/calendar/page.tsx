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
import { getCourses, getNextInstances, siteSettings, type DatedInstance } from "@/lib/content";
import { formatDateRange, formatMonthYear, isoDate, monthKey } from "@/lib/format";
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

export default function CalendarPage() {
  const dated = getNextInstances();
  const months = groupByMonth(dated);
  const courses = getCourses();

  return (
    <>
      <PageHero
        above={<Breadcrumbs items={[{ label: "Calendar", href: "/calendar" }]} />}
        eyebrow="Calendar"
        title="Course dates in Bengaluru"
        intro={
          <p>
            Every batch the academy has scheduled, soonest first. Dates are set a few weeks ahead,
            so the reliable way to catch the one you want is the batch alert rather than checking
            back.
          </p>
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
                        <span className="flex shrink-0 items-center gap-2 type-label text-red">
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
                      <tr className="border-b border-white-2">
                        <th scope="col" className="py-3 pr-4 type-label text-grey">
                          Dates
                        </th>
                        <th scope="col" className="py-3 pr-4 type-label text-grey">
                          Course
                        </th>
                        <th scope="col" className="py-3 pr-4 type-label text-grey">
                          Level
                        </th>
                        <th scope="col" className="py-3 type-label text-grey">
                          <span className="sr-only">Reserve a seat</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {month.entries.map(({ course, instance, startDate }) => (
                        <tr key={instance.id} className="border-b border-white-2">
                          <td className="py-4 pr-4">
                            <time dateTime={startDate} className="type-numeral text-h3-lg text-black">
                              {formatDateRange(instance.startDate, instance.endDate)}
                            </time>
                          </td>
                          <th scope="row" className="py-4 pr-4 type-body font-medium">
                            <Link
                              href={`/courses/${course.slug}`}
                              className="text-black underline decoration-white-2 underline-offset-4 hover:text-red hover:decoration-red"
                            >
                              {course.title}
                            </Link>
                          </th>
                          <td className="py-4 pr-4">
                            <LevelBadge level={course.level} />
                          </td>
                          <td className="py-4">
                            <ButtonLink
                              href={`/enquire?course=${course.slug}`}
                              variant="primary"
                              size="sm"
                              data-event="reserve_click_calendar"
                            >
                              Reserve
                            </ButtonLink>
                          </td>
                        </tr>
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
          ...dated.map(({ course, instance, startDate }) => ({
            "@type": "Event",
            "@id": absoluteUrl(`/calendar#${instance.id}`),
            name: `${course.title} at ${siteSettings.name}`,
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
