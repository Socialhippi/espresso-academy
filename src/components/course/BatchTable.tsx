import { ButtonLink } from "@/components/site/Button";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { TbcPill } from "@/components/site/TbcPill";
import { WaitlistInline } from "@/components/course/WaitlistInline";
import { formatDateRange } from "@/lib/format";
import { batchAction, seatsLeft, type Course, type CourseInstance } from "@/lib/content";
import { cn } from "@/lib/utils";

interface BatchTableProps {
  course: Course;
  className?: string;
}

const statusLabel: Record<CourseInstance["status"], string> = {
  open: "Open",
  waitlist: "Waitlist",
  soldout: "Full",
  completed: "Finished",
  tbc: "Dates being finalised",
};

/**
 * Book, Waitlist or Enquire, decided by `batchAction` in src/lib/content.ts rather than here.
 *
 * The rule is the same on the course page, the calendar and the workshops page, and it was worth
 * one function: three copies of "is this bookable" is three chances to offer a Book button for a
 * batch with no fee.
 */
function BatchCta({
  course,
  instance,
  emphasis = "primary",
}: {
  course: Course;
  instance: CourseInstance;
  /**
   * Red on the first bookable row, outline on the rest.
   *
   * Three open batches turned the mobile list into three stacked full-width red pills with the
   * red sticky bar under them, which is design.md's "must never look like a bar or a gym". They
   * are the same action at the same weight, so only the soonest one carries the accent.
   */
  emphasis?: "primary" | "secondary";
}) {
  const action = batchAction(course, instance);
  /* The dates cell is the row header, so a screen reader announces it before this button in table
     mode. The stacked list below md has no such structure, and three links whose entire
     accessible name is "Book" is a WCAG 2.4.4 failure either way. */
  const dates = formatDateRange(instance.startDate, instance.endDate);

  if (action === "book") {
    return (
      <ButtonLink
        href={`/book/${instance.id}`}
        variant={emphasis}
        size="sm"
        data-event="book_click_batch"
        data-course={course.slug}
      >
        Book
        <span className="sr-only">: {dates}</span>
      </ButtonLink>
    );
  }

  /* The id, not the date. `courseCta` already passes an id, the enquiry form's options are keyed
     by id, and only an id links the enquiry to the batch document so the person shows up on that
     batch's roster in the Studio. A formatted date matched no option and joined to nothing. */
  return (
    <ButtonLink
      href={`/enquire?course=${course.slug}&batch=${instance.id}`}
      variant={action === "waitlist" ? "secondary" : emphasis}
      size="sm"
      data-event={action === "waitlist" ? "waitlist_click_batch" : "enquire_click_batch"}
      data-course={course.slug}
    >
      {action === "waitlist" ? "Waitlist" : "Enquire"}
      <span className="sr-only">: {dates}</span>
    </ButtonLink>
  );
}

/**
 * The scheduled batches for one course. Every instance in content/data.ts is currently a `tbc`
 * placeholder, so this renders the empty state and the batch alert rather than an empty table.
 */
export function BatchTable({ course, className }: BatchTableProps) {
  const dated = course.instances.filter((instance) => instance.startDate !== null);

  if (dated.length === 0) {
    return (
      <div className={cn("border border-white-2 bg-white-3 p-6 md:p-8", className)}>
        <p className="type-h3 text-black">Batch dates are being finalised</p>
        <p className="mt-3 measure type-body text-grey">
          Dates for the next batch are not published yet. Leave your number and you will be told first,
          before the batch is listed here.
        </p>
        <WaitlistInline course={course.title} className="mt-6" />
        <p className="mt-6 hairline pt-6 type-small text-grey">
          Or just ask.
        </p>
        <WhatsAppButton className="mt-3" size="sm" course={course.title} event="whatsapp_click_batches">
          Ask when this runs
        </WhatsAppButton>
      </div>
    );
  }

  return (
    <div className={className}>
      {/*
        Below md the five columns do not fit: the table is 376px inside a 350px scroller at 390, so
        the Book or Waitlist button — the whole point of the row — was clipped mid-word with no
        scroll affordance on the 64% of this audience that is on a phone. Stacked rows there, the
        table from md up where it fits. Same data, same order, one source. This mirrors the pattern
        already used for the fee table on /courses.
      */}
      <ul className="divide-y divide-white-2 border-y border-white-2 md:hidden">
        {dated.map((instance, index) => (
          <li key={instance.id} className="flex flex-col gap-3 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <time dateTime={instance.startDate ?? undefined} className="type-numeral text-h3-lg">
                {formatDateRange(instance.startDate, instance.endDate)}
              </time>
              <span className="type-small text-black">{statusLabel[instance.status]}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 type-small text-grey">
              <span>{instance.schedule ?? <TbcPill />}</span>
              {seatsLeft(instance) === null ? (
                <TbcPill />
              ) : (
                <span className="text-black">{seatsLeft(instance)} left</span>
              )}
            </div>
            {/* self-start, or the flex column stretches a 350px-wide red pill across the row. */}
            <div className="self-start">
              <BatchCta
                course={course}
                instance={instance}
                emphasis={index === 0 ? "primary" : "secondary"}
              />
            </div>
          </li>
        ))}
      </ul>

      <div className="table-scroll max-md:hidden">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">Scheduled batches for {course.title}</caption>
        <thead>
          <tr className="border-b border-white-2">
            <th scope="col" className="py-3 pr-4 type-label text-grey">
              Dates
            </th>
            <th scope="col" className="py-3 pr-4 type-label text-grey">
              Schedule
            </th>
            <th scope="col" className="py-3 pr-4 type-label text-grey">
              Seats
            </th>
            <th scope="col" className="py-3 pr-4 type-label text-grey">
              Status
            </th>
            <th scope="col" className="py-3 type-label text-grey">
              <span className="sr-only">Book or ask</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {dated.map((instance, index) => (
            <tr key={instance.id} className="border-b border-white-2 align-middle">
              {/* th, not td: it is what names the row, and it is what a screen reader announces
                  before the Book button at the end of it. */}
              <th scope="row" className="py-4 pr-4 text-left font-normal">
                <time dateTime={instance.startDate ?? undefined} className="type-numeral text-h3-lg">
                  {formatDateRange(instance.startDate, instance.endDate)}
                </time>
              </th>
              <td className="py-4 pr-4 type-small text-grey">
                {instance.schedule ?? <TbcPill />}
              </td>
              <td className="py-4 pr-4 type-small text-grey">
                {seatsLeft(instance) === null ? (
                  <TbcPill />
                ) : (
                  <span className="text-black">{seatsLeft(instance)} left</span>
                )}
              </td>
              <td className="py-4 pr-4 type-small text-black">{statusLabel[instance.status]}</td>
              <td className="py-4">
                <BatchCta
                  course={course}
                  instance={instance}
                  emphasis={index === 0 ? "primary" : "secondary"}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
