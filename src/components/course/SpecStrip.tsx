import Link from "next/link";
import { LevelBadge } from "@/components/site/LevelBadge";
import { EX_GST, feeInclGst, formatDate, formatDuration, formatFeeAmount, INCL_GST } from "@/lib/format";
import {
  courseFeeExGst,
  formatLabel,
  getCertification,
  getNextInstanceForCourse,
  type Course,
} from "@/lib/content";
import { cn } from "@/lib/utils";

interface SpecStripProps {
  course: Course;
  className?: string;
}

interface SpecProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

function Spec({ label, children, className }: SpecProps) {
  return (
    <div className={cn("flex flex-col gap-2 border-t border-white-2 pt-4", className)}>
      <dt className="type-label text-grey">{label}</dt>
      <dd className="type-body text-black">{children}</dd>
    </div>
  );
}

/**
 * The certificate cell, label included.
 *
 * The label cannot be a constant "Certificate". content/facts.md lists "SCA-certified courses"
 * among the phrases the site must never use, so a cell reading Certificate / SCA asserts exactly
 * the claim that is forbidden: the SCA issues its certification itself, on an assessed module,
 * and the academy does not run an SCA course at all. The certification's own `status` carries the
 * distinction already, so it drives the label rather than a slug hard-coded here.
 *
 * No course currently references the SCA certification, so this branch is unused today. It stays
 * because the rule outlives the catalogue: the moment an editor points a course at the SCA
 * document, the cell has to say "Programme" rather than "Certificate" without anyone remembering
 * to ask for it.
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
            neighbours and breaks the strip. It is stated in full in the body. The suffix is for
            a screen reader running a link list, where "IBC" on its own says nothing. */}
        {certification.shortName}
        <span className="sr-only">: what this certificate is worth</span>
      </Link>
    ),
  };
}

/**
 * The facts a reader wants before anything else. Every one the client has not confirmed shows a
 * TBC pill rather than an assumption.
 *
 * Four columns, not six. Revision 2 filled in the duration, the hours, the format, the fee and
 * three batch dates, and a seven-cell strip on a six-column grid orphaned "Next batch" alone on
 * its own row at 1280, at 768 and at 390 — on the first screen of the highest-value page.
 */
export async function SpecStrip({ course, className }: SpecStripProps) {
  const nextInstance = getNextInstanceForCourse(course);
  const hasDuration = course.durationDays !== null || course.durationHours !== null;
  /* The fee after any offer, not the standard one. `course.feeExGst` is what gets struck through
     on the fee block below; printing it here would quote a price nobody is charged. */
  const fee = courseFeeExGst(course);
  const total = feeInclGst({ exGst: fee, gstRate: course.gstRate });

  /*
   * The unknowns must not be the loudest thing under the H1.
   *
   * Seven cells each carrying a TBC pill is a page that shouts about what it does not know before
   * it says anything it does. One sentence says the same thing and offers the way to find out.
   * Every cell that has a value is still shown; the sentence only stands in for the ones that do
   * not, and it disappears entirely once the academy has filled them all in. No code change is
   * needed when that happens.
   */
  /*
   * Only the facts this strip is responsible for.
   *
   * It used to count the trainer, the prerequisites and the syllabus too, and each of those has
   * its own place further down the page that says the same thing in more useful words. On the IBC
   * Basic, where the client has now confirmed the duration, the hours, the format, the fee and
   * three batch dates, that left a "Still to confirm" cell under a strip in which every single
   * cell was confirmed, pointing at an unassigned trainer the reader cannot see from here.
   */
  const unknown = {
    duration: !hasDuration,
    schedule: course.schedule === null,
    format: course.format === null,
    fee: fee === null,
    dates: !nextInstance?.startDate,
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
        "grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4",
        className,
      )}
    >
      {/* A cell appears when it has something to say. The ones that do not are covered by the one
          line at the end, which is a sentence a reader can act on rather than a row of pills. */}
      {hasDuration && (
        <Spec label="Duration">{formatDuration(course.durationDays, course.durationHours)}</Spec>
      )}

      {course.format && <Spec label="Format">{formatLabel[course.format]}</Spec>}

      {/* The daily hours, not the total: "4 days" above is the length, this is when to be there,
          and it is the question the academy gets asked most after the fee. */}
      {course.schedule && <Spec label="Hours">{course.schedule}</Spec>}

      <Spec label="Level">
        <LevelBadge level={course.level} />
      </Spec>

      <Spec label={certificate.label}>{certificate.value}</Spec>

      {fee !== null && (
        <Spec label="Fee">
          <span className="type-numeral text-h3-lg">{formatFeeAmount(fee)}</span>{" "}
          <span className="type-small text-grey">{EX_GST}</span>
          {total !== null && (
            /* The total on its own line rather than trailing the suffix: at 390 the strip is two
               columns and "₹26,700 + GST ₹31,506 incl. GST" on one line wraps mid-figure. */
            <span className="mt-1 block type-small text-black">
              {formatFeeAmount(total)} {INCL_GST}
            </span>
          )}
        </Spec>
      )}

      {nextInstance?.startDate && (
        /* Bebas, like the fee beside it and like the same value on a course card. design.md
           reserves the display face for fee figures and batch dates, and this is one. */
        <Spec label="Next batch" className="max-md:col-span-2">
          <time dateTime={nextInstance.startDate} className="type-numeral text-h3-lg">
            {formatDate(nextInstance.startDate)}
          </time>
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
