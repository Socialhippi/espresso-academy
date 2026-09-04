import Link from "next/link";
import { TbcPill } from "@/components/site/TbcPill";
import { LevelBadge } from "@/components/site/LevelBadge";
import { formatDate, formatDuration, formatFeeAmount } from "@/lib/format";
import { formatLabel, getCertification, getNextInstanceForCourse, type Course } from "@/lib/content";
import { cn } from "@/lib/utils";

interface SpecStripProps {
  course: Course;
  className?: string;
}

interface SpecProps {
  label: string;
  children: React.ReactNode;
}

function Spec({ label, children }: SpecProps) {
  return (
    <div className="flex flex-col gap-2 border-t border-white-2 pt-4">
      <dt className="type-label text-grey">{label}</dt>
      <dd className="type-body text-black">{children}</dd>
    </div>
  );
}

/**
 * The six facts a reader wants before anything else. Every one that the client has not confirmed
 * shows a TBC pill rather than an assumption.
 */
export function SpecStrip({ course, className }: SpecStripProps) {
  const nextInstance = getNextInstanceForCourse(course);
  const hasDuration = course.durationDays !== null || course.durationHours !== null;

  return (
    <dl
      className={cn(
        "grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-3 lg:grid-cols-6",
        className,
      )}
    >
      <Spec label="Duration">
        {hasDuration ? formatDuration(course.durationDays, course.durationHours) : <TbcPill />}
      </Spec>

      <Spec label="Format">
        {course.format ? formatLabel[course.format] : <TbcPill />}
      </Spec>

      <Spec label="Level">
        <LevelBadge level={course.level} />
      </Spec>

      <Spec label="Certificate">
        {course.certification ? (
          <Link
            href={`/certifications/${course.certification}`}
            className="text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
          >
            {/* The short name: the full awarded label runs to four lines here against one-line
                neighbours and breaks the strip. It is stated in full in the body. */}
            {getCertification(course.certification)?.shortName ?? "Certificate"}
          </Link>
        ) : (
          "None issued"
        )}
      </Spec>

      <Spec label="Fee">
        {course.feeInclGst !== null ? (
          <>
            <span className="type-numeral text-h3-lg">{formatFeeAmount(course.feeInclGst)}</span>{" "}
            <span className="type-small text-grey">incl. GST</span>
          </>
        ) : (
          <TbcPill />
        )}
      </Spec>

      <Spec label="Next batch">
        {nextInstance?.startDate ? (
          <time dateTime={nextInstance.startDate}>{formatDate(nextInstance.startDate)}</time>
        ) : (
          <TbcPill label="Dates TBC" />
        )}
      </Spec>
    </dl>
  );
}
