import Link from "next/link";
import { ButtonLink } from "@/components/site/Button";
import { LevelBadge } from "@/components/site/LevelBadge";
import { TbcPill } from "@/components/site/TbcPill";
import { batchAction, feeForInstance, seatsLeft, type Course, type CourseInstance } from "@/lib/content";
import { feeSuffix, formatDate, formatDateRange, formatFeeAmount } from "@/lib/format";

interface BatchRowProps {
  course: Course;
  instance: CourseInstance;
  /** The workshops page leads with the fee; the calendar leads with the level. */
  variant?: "calendar" | "workshop";
}

/**
 * One scheduled batch, as a table row.
 *
 * Shared by the calendar and the workshops page so the two cannot disagree about whether a batch
 * is bookable. The decision itself is `batchAction` in src/lib/batch.ts, which the course page's
 * `BatchTable` uses too: three pages rendering the same row is three chances to offer a Book button
 * for a batch with no fee.
 */
export function BatchRow({ course, instance, variant = "calendar" }: BatchRowProps) {
  const action = batchAction(course, instance);
  const fee = feeForInstance(course, instance);
  const seats = seatsLeft(instance);
  const batchLabel = encodeURIComponent(formatDate(instance.startDate));

  return (
    <tr className="border-b border-white-2 align-middle">
      <td className="py-4 pr-4">
        <time dateTime={instance.startDate ?? undefined} className="type-numeral text-h3-lg text-black">
          {formatDateRange(instance.startDate, instance.endDate)}
        </time>
      </td>

      <th scope="row" className="py-4 pr-4 type-body font-medium">
        <Link
          href={`/courses/${course.slug}`}
          /* min-h-11: the row is tall enough, but the link's own box was 19px, and the target-size
             rule measures the target, not the row it sits in. */
          className="inline-flex min-h-11 items-center text-black underline decoration-white-2 underline-offset-4 hover:text-red hover:decoration-red"
        >
          {course.title}
        </Link>
      </th>

      {variant === "calendar" ? (
        <td className="py-4 pr-4">
          <LevelBadge level={course.level} />
        </td>
      ) : (
        <td className="py-4 pr-4 type-body text-black">
          {/* TODO(client): every fee is null today, so this is a TBC pill on every row. */}
          {fee === null ? (
            <TbcPill label="Fee TBC" />
          ) : (
            `${formatFeeAmount(fee)} ${feeSuffix(course.gstRate)}`
          )}
        </td>
      )}

      <td className="py-4 pr-4 type-small">
        {seats === null ? (
          <TbcPill />
        ) : seats === 0 ? (
          <span className="text-grey">Full</span>
        ) : (
          <span className="text-black">{seats} left</span>
        )}
      </td>

      <td className="py-4">
        {action === "book" ? (
          <ButtonLink
            href={`/book/${instance.id}`}
            variant="primary"
            size="sm"
            data-event={`book_click_${variant}`}
            data-course={course.slug}
          >
            Book
          </ButtonLink>
        ) : (
          <ButtonLink
            href={`/enquire?course=${course.slug}&batch=${batchLabel}`}
            variant={action === "waitlist" ? "secondary" : "primary"}
            size="sm"
            data-event={`${action}_click_${variant}`}
            data-course={course.slug}
          >
            {action === "waitlist" ? "Waitlist" : "Enquire"}
          </ButtonLink>
        )}
      </td>
    </tr>
  );
}

/** The header row that goes with `BatchRow`, so the columns cannot drift apart. */
export function BatchRowHeader({ variant = "calendar" }: { variant?: "calendar" | "workshop" }) {
  return (
    <tr className="border-b border-black text-left">
      <th scope="col" className="py-3 pr-4 type-label text-grey">
        Dates
      </th>
      <th scope="col" className="py-3 pr-4 type-label text-grey">
        Course
      </th>
      <th scope="col" className="py-3 pr-4 type-label text-grey">
        {variant === "calendar" ? "Level" : "Fee"}
      </th>
      <th scope="col" className="py-3 pr-4 type-label text-grey">
        Seats
      </th>
      <th scope="col" className="py-3 type-label text-grey">
        <span className="sr-only">Book a seat</span>
      </th>
    </tr>
  );
}
