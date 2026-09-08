import { TbcPill } from "@/components/site/TbcPill";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { formatFeeAmount, formatDate, feeInclGst, feeSuffix } from "@/lib/format";
import { courseCta, feeForInstance, type Course } from "@/lib/content";
import { cn } from "@/lib/utils";

interface FeeBlockProps {
  course: Course;
  className?: string;
}

/**
 * What it costs.
 *
 * The course fee is not the only fee. A batch can carry a `priceOverrideExGst`, and that is what
 * the checkout charges, so this block read `course.feeExGst`, printed "Fee: TBC", and sat on a
 * page whose hero, sticky bar and batch table all said "Book this batch". A reader was being sent
 * to a payment window without ever having been shown a number. It reads the fee the bookable batch
 * will actually charge, falls back to the course fee, and only then to TBC.
 *
 * Two rules from revision 2 of content/facts.md govern what it may print:
 *
 * - The figure is ex-GST, and reads "+ GST", because that is how the client quotes it.
 * - While `gstRate` is null no tax-inclusive total appears. facts.md notes 18% as the usual rate
 *   on commercial training and notes it as an assumption; a total derived from an assumption is a
 *   number the academy would have to argue with a student about.
 */
export function FeeBlock({ course, className }: FeeBlockProps) {
  const cta = courseCta(course, course.instances);
  const bookable = cta.instanceId
    ? course.instances.find((instance) => instance.id === cta.instanceId)
    : undefined;
  const batchFee = bookable ? feeForInstance(course, bookable) : null;
  const fee = batchFee ?? course.feeExGst;
  const hasFee = fee !== null;
  const total = feeInclGst({ exGst: fee, gstRate: course.gstRate });
  /* Named, because a batch price is that batch's price and not the course's. */
  const qualifier =
    batchFee !== null && bookable?.startDate ? `for the ${formatDate(bookable.startDate)} batch` : null;

  /* An offer only makes sense against the course's own list price. A batch override is a different
     price for a different cohort, not a discount off this one, so the strike-through goes away
     with it rather than claiming a saving nobody is getting. */
  const showsOffer =
    hasFee &&
    batchFee === null &&
    course.listPriceExGst !== null &&
    course.listPriceExGst > fee &&
    course.offerLabel !== null;

  return (
    <div className={cn("border border-white-2 bg-white-3 p-6 md:p-8", className)}>
      <p className="type-label text-grey">Fee</p>

      {hasFee ? (
        <>
          <p className="mt-3">
            <span className="type-numeral text-display text-black">{formatFeeAmount(fee)}</span>{" "}
            <span className="type-body text-grey">
              {feeSuffix(course.gstRate)}
              {qualifier ? ` ${qualifier}` : ""}
            </span>
          </p>

          {showsOffer && (
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
              {/* The strike-through is decoration to a screen reader, so the relationship is
                  said in words rather than drawn. */}
              <span className="sr-only">Usual price</span>
              <s className="type-body text-grey">
                {formatFeeAmount(course.listPriceExGst)} {feeSuffix(course.gstRate)}
              </s>
              {/* Black on red-tint, not red text: design.md puts a 16px floor under red type and
                  this label is 12px. red-tint is the token for exactly this kind of chip. */}
              <span className="inline-flex items-center rounded-xs bg-red-tint px-3 py-1 type-label text-black">
                {course.offerLabel}
              </span>
            </p>
          )}

          {total !== null && (
            <p className="mt-2 type-small text-grey">
              {formatFeeAmount(total)} incl. GST at {course.gstRate}%
            </p>
          )}
        </>
      ) : (
        <div className="mt-3 flex items-center gap-3">
          <TbcPill />
          {/* TODO(client): facts.md publishes no fee for either Advanced course. */}
          <p className="type-body text-black">The academy confirms the fee for each batch.</p>
        </div>
      )}

      <ul className="mt-6 flex flex-col gap-3 type-small text-grey">
        {hasFee && course.gstRate === null && (
          /* TODO(client): open question 1 in content/facts.md. Until it is answered the site
             cannot print a single tax-inclusive figure, and saying so is better than a reader
             working one out and being surprised at the counter. */
          <li>
            GST is charged on top of this figure. The academy is confirming the rate, so no
            tax-inclusive total is shown here yet. Ask and you will be told the total before you
            pay anything.
          </li>
        )}
        <li>
          The certificate is part of the fee. No certification body charges a separate fee on top
          of it.
        </li>
        <li className="flex flex-wrap items-center gap-2">
          EMI:{" "}
          {course.emiAvailable === null ? (
            <TbcPill />
          ) : (
            <span className="text-black">{course.emiAvailable ? "Available" : "Not offered"}</span>
          )}
        </li>
        <li>
          What the fee includes:{" "}
          {course.includes && course.includes.length > 0 ? (
            <span className="text-black">{course.includes.join(", ")}</span>
          ) : (
            <TbcPill />
          )}
        </li>
      </ul>

      <div className="mt-6">
        <WhatsAppButton size="sm" course={course.title} event="whatsapp_click_fee">
          {hasFee ? "Ask about the fee" : "Ask for the current fee"}
        </WhatsAppButton>
      </div>
    </div>
  );
}
