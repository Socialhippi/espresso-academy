import { TbcPill } from "@/components/site/TbcPill";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { formatFeeAmount, formatDate } from "@/lib/format";
import { courseCta, feeForInstance, type Course } from "@/lib/content";
import { cn } from "@/lib/utils";

interface FeeBlockProps {
  course: Course;
  className?: string;
}

/**
 * What it costs.
 *
 * The course fee is not the only fee. A batch can carry a `priceOverride`, and that is what the
 * checkout charges — so this block read `course.feeInclGst`, printed "Fee: TBC", and sat on a page
 * whose hero, sticky bar and batch table all said "Book this batch". A reader was being sent to a
 * payment window without ever having been shown a number. It reads the fee the bookable batch will
 * actually charge, and falls back to the course fee, and only then to TBC.
 */
export function FeeBlock({ course, className }: FeeBlockProps) {
  const cta = courseCta(course, course.instances);
  const bookable = cta.instanceId
    ? course.instances.find((instance) => instance.id === cta.instanceId)
    : undefined;
  const batchFee = bookable ? feeForInstance(course, bookable) : null;
  const fee = batchFee ?? course.feeInclGst;
  const hasFee = fee !== null;
  /* Named, because a batch price is that batch's price and not the course's. */
  const qualifier =
    batchFee !== null && bookable?.startDate ? `for the ${formatDate(bookable.startDate)} batch` : null;

  return (
    <div className={cn("border border-white-2 bg-white-3 p-6 md:p-8", className)}>
      <p className="type-label text-grey">Fee</p>

      {hasFee ? (
        <p className="mt-3">
          <span className="type-numeral text-display text-black">{formatFeeAmount(fee)}</span>{" "}
          <span className="type-body text-grey">incl. GST{qualifier ? ` ${qualifier}` : ""}</span>
        </p>
      ) : (
        <div className="mt-3 flex items-center gap-3">
          <TbcPill />
          {/* TODO(client): course.feeInclGst. No fee for any course is published anywhere. */}
          <p className="type-body text-black">The academy confirms the fee for each batch.</p>
        </div>
      )}

      <ul className="mt-6 flex flex-col gap-3 type-small text-grey">
        <li>
          Fees are stated incl. GST before you pay. Where a certification body charges its own fee,
          we say so first.
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
          Ask for the current fee
        </WhatsAppButton>
      </div>
    </div>
  );
}
