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
 * The certificate cell, label included.
 *
 * The label cannot be a constant "Certificate". content/facts.md line 25 permits only "training
 * aligned to the SCA Coffee Skills Program" and line 45 lists "SCA-certified courses" among the
 * phrases the site must never use, so a cell reading Certificate / SCA asserts exactly the claim
 * that is forbidden: the SCA issues its certification itself, on an assessed module, and whether a
 * given batch is assessed is not confirmed. The certification's own `status` carries the
 * distinction already, so it drives the label rather than a slug hard-coded here.
 */
function certificateCell(course: Course): { label: string; value: React.ReactNode } {
  const certification = course.certification ? getCertification(course.certification) : null;
  if (!certification) return { label: "Certificate", value: "None issued" };

  return {
    label: certification.status === "confirmed" ? "Certificate" : "Programme",
    value: (
      <Link
        href={`/certifications/${certification.slug}`}
        className="inline-flex min-h-11 min-w-11 items-center text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
      >
        {/* The short name: the full awarded label runs to four lines here against one-line
            neighbours and breaks the strip. It is stated in full in the body. */}
        {certification.shortName}
      </Link>
    ),
  };
}

/**
 * The six facts a reader wants before anything else. Every one that the client has not confirmed
 * shows a TBC pill rather than an assumption.
 */
export function SpecStrip({ course, className }: SpecStripProps) {
  const nextInstance = getNextInstanceForCourse(course);
  const hasDuration = course.durationDays !== null || course.durationHours !== null;

  /*
   * While the academy has confirmed none of the four variable facts, four TBC pills are the first
   * thing under the H1 and the unknowns become the loudest thing on the page. Collapse them onto
   * one line and keep the two facts that are real. The full six-cell strip returns the moment any
   * one value lands, with no code change. CourseCard already does this on the hub.
   */
  const unknownSpecs = !hasDuration && course.format === null && course.feeInclGst === null
    && !nextInstance?.startDate;

  const certificate = certificateCell(course);

  if (unknownSpecs) {
    return (
      <dl className={cn("grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-4", className)}>
        <Spec label="Level">
          <LevelBadge level={course.level} />
        </Spec>

        <Spec label={certificate.label}>{certificate.value}</Spec>

        <div className="col-span-2 flex flex-col gap-2 border-t border-white-2 pt-4">
          <dt className="type-label text-grey">Duration, format, fee and dates</dt>
          <dd className="type-body text-black">
            <TbcPill />
          </dd>
        </div>
      </dl>
    );
  }

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

      <Spec label={certificate.label}>{certificate.value}</Spec>

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
