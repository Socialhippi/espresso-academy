import { ButtonLink } from "@/components/site/Button";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { TbcPill } from "@/components/site/TbcPill";
import { WaitlistInline } from "@/components/course/WaitlistInline";
import { formatDate, formatDateRange } from "@/lib/format";
import type { Course, CourseInstance } from "@/lib/content";
import { cn } from "@/lib/utils";

interface BatchTableProps {
  course: Course;
  className?: string;
}

const statusLabel: Record<CourseInstance["status"], string> = {
  open: "Open",
  waitlist: "Waitlist",
  soldout: "Full",
  tbc: "Dates being finalised",
};

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
          The academy sets dates a few weeks ahead. Leave your number and you will be told first,
          before the batch is listed here.
        </p>
        <WaitlistInline course={course.title} className="mt-6" />
        <p className="mt-6 hairline pt-6 type-small text-grey">
          Would rather just ask?
        </p>
        <WhatsAppButton className="mt-3" size="sm" course={course.title} event="whatsapp_click_batches">
          Ask when this runs
        </WhatsAppButton>
      </div>
    );
  }

  return (
    <div className={cn("table-scroll", className)}>
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
              <span className="sr-only">Reserve a seat</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {dated.map((instance) => (
            <tr key={instance.id} className="border-b border-white-2 align-middle">
              <td className="py-4 pr-4">
                <time dateTime={instance.startDate ?? undefined} className="type-numeral text-h3-lg">
                  {formatDateRange(instance.startDate, instance.endDate)}
                </time>
              </td>
              <td className="py-4 pr-4 type-small text-grey">
                {instance.schedule ?? <TbcPill />}
              </td>
              <td className="py-4 pr-4 type-small text-grey">
                {instance.seatsAvailable === null ? (
                  <TbcPill />
                ) : (
                  <span className="text-black">{instance.seatsAvailable} left</span>
                )}
              </td>
              <td className="py-4 pr-4 type-small text-black">{statusLabel[instance.status]}</td>
              <td className="py-4">
                <ButtonLink
                  href={`/enquire?course=${course.slug}&batch=${encodeURIComponent(
                    formatDate(instance.startDate),
                  )}`}
                  variant="primary"
                  size="sm"
                  data-event="reserve_click_batch"
                >
                  Reserve
                </ButtonLink>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
