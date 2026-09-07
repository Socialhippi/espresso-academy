import Link from "next/link";
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
async function certificateCell(course: Course): Promise<{ label: string; value: React.ReactNode }> {
  const certification = course.certification ? await getCertification(course.certification) : null;
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
export async function SpecStrip({ course, className }: SpecStripProps) {
  const nextInstance = getNextInstanceForCourse(course);
  const hasDuration = course.durationDays !== null || course.durationHours !== null;

  /*
   * The unknowns must not be the loudest thing under the H1.
   *
   * Seven cells each carrying a TBC pill is a page that shouts about what it does not know before
   * it says anything it does. One sentence says the same thing and offers the way to find out.
   * Every cell that has a value is still shown; the sentence only stands in for the ones that do
   * not, and it disappears entirely once the academy has filled them all in. No code change is
   * needed when that happens.
   */
  const unknown = {
    duration: !hasDuration,
    format: course.format === null,
    fee: course.feeInclGst === null,
    dates: !nextInstance?.startDate,
    prerequisites: course.prerequisites === null,
    trainer: course.trainers.length === 0,
    syllabus: course.modules === null || course.modules.length === 0,
  };
  const anyUnknown = Object.values(unknown).some(Boolean);
  const unknownSpecs = Object.values(unknown).every(Boolean);

  const certificate = await certificateCell(course);

  if (unknownSpecs) {
    return (
      <dl className={cn("grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-4", className)}>
        <Spec label="Level">
          <LevelBadge level={course.level} />
        </Spec>

        <Spec label={certificate.label}>{certificate.value}</Spec>

        <div className="col-span-2 flex flex-col gap-2 border-t border-white-2 pt-4">
          <dt className="type-label text-grey">Fee, dates and duration</dt>
          <dd className="type-body text-black">Confirmed on WhatsApp before you pay</dd>
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
      {/* A cell appears when it has something to say. The ones that do not are covered by the one
          line at the end, which is a sentence a reader can act on rather than a row of pills. */}
      {hasDuration && (
        <Spec label="Duration">{formatDuration(course.durationDays, course.durationHours)}</Spec>
      )}

      {course.format && <Spec label="Format">{formatLabel[course.format]}</Spec>}

      <Spec label="Level">
        <LevelBadge level={course.level} />
      </Spec>

      <Spec label={certificate.label}>{certificate.value}</Spec>

      {course.feeInclGst !== null && (
        <Spec label="Fee">
          <span className="type-numeral text-h3-lg">{formatFeeAmount(course.feeInclGst)}</span>{" "}
          <span className="type-small text-grey">incl. GST</span>
        </Spec>
      )}

      {nextInstance?.startDate && (
        <Spec label="Next batch">
          <time dateTime={nextInstance.startDate}>{formatDate(nextInstance.startDate)}</time>
        </Spec>
      )}

      {anyUnknown && (
        <div className="col-span-2 flex flex-col gap-2 border-t border-white-2 pt-4 md:col-span-3 lg:col-span-2">
          <dt className="type-label text-grey">Still to confirm</dt>
          <dd className="type-body text-black">Confirmed on WhatsApp before you pay</dd>
        </div>
      )}
    </dl>
  );
}
