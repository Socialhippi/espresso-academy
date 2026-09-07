import Link from "next/link";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ButtonLink } from "@/components/site/Button";
import { WaitlistInline } from "@/components/course/WaitlistInline";
import { batchAction, getNextInstances } from "@/lib/content";
import { formatDate, formatDateRange } from "@/lib/format";
import { cn } from "@/lib/utils";

interface NextBatchesProps {
  count?: number;
  className?: string;
  number?: string;
  /** Uses the shorter section padding, for pages that need to vary their rhythm. */
  compact?: boolean;
}

/**
 * The soonest scheduled batches. content/data.ts has no dated instance yet, so what actually
 * renders today is the honest empty state with a batch alert, not an empty list.
 */
export async function NextBatches({ count = 4, className, number = "02", compact = false }: NextBatchesProps) {
  const next = await getNextInstances(count);

  return (
    <section
      className={cn(compact ? "section-y-sm" : "section-y", "bg-white-3", className)}
      aria-labelledby="batches-heading"
    >
      <Container>
        <SectionHeading
          number={number}
          eyebrow="Dates"
          title="Next batches"
          id="batches-heading"
          action={
            <ButtonLink href="/calendar" variant="tertiary" size="inline">
              See the full calendar
            </ButtonLink>
          }
        />

        {next.length === 0 ? (
          <div className="mt-10 border border-white-2 bg-white p-6 md:mt-14 md:p-10">
            <p className="type-h3 text-black">Batch dates are being finalised</p>
            <p className="mt-3 measure type-body text-grey">
              Dates for the next batches are not published yet. Get the first alert and you will hear
              before the batch appears here.
            </p>
            <WaitlistInline className="mt-6" />
          </div>
        ) : (
          <ul className="mt-10 divide-y divide-white-2 border-y border-white-2 md:mt-14">
            {next.map(({ course, instance, startDate }) => (
              <li key={instance.id} className="flex flex-col gap-2 py-5 md:flex-row md:items-baseline md:gap-8">
                <Link
                  href={`/courses/${course.slug}`}
                  className="group flex flex-1 flex-col gap-2 md:flex-row md:items-baseline md:justify-between md:gap-8"
                >
                  <time dateTime={startDate} className="type-numeral text-h2 text-black md:w-64">
                    {formatDateRange(instance.startDate, instance.endDate)}
                  </time>
                  <span className="flex-1 type-body text-black group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
                    {course.title}
                  </span>
                  <span className="type-small text-grey">
                    {instance.schedule ?? formatDate(startDate)}
                  </span>
                </Link>
                {/* Same rule as the hero and the hub card: a row for a batch somebody can pay for
                    offers the checkout rather than making them find it two pages away. Outside the
                    row link, because a link cannot contain a link. */}
                {batchAction(course, instance) === "book" && (
                  <Link
                    href={`/book/${instance.id}`}
                    data-event="book_click_home"
                    className="inline-flex min-h-11 shrink-0 items-center type-label text-red underline decoration-1 underline-offset-4 hover:text-red-deep md:self-center"
                  >
                    Book
                    <span className="sr-only">
                      : {course.title}, {formatDateRange(instance.startDate, instance.endDate)}
                    </span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}
