import { TbcPill } from "@/components/site/TbcPill";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { formatFeeAmount } from "@/lib/format";
import type { Course } from "@/lib/content";
import { cn } from "@/lib/utils";

interface FeeBlockProps {
  course: Course;
  className?: string;
}

/**
 * What it costs. content/facts.md carries no fee for any course, so the figure is a TBC pill and
 * the reader is offered a real way to get the number today.
 */
export function FeeBlock({ course, className }: FeeBlockProps) {
  const hasFee = course.feeInclGst !== null;

  return (
    <div className={cn("border border-white-2 bg-white-3 p-6 md:p-8", className)}>
      <p className="type-label text-grey">Fee</p>

      {hasFee ? (
        <p className="mt-3">
          <span className="type-numeral text-display text-black">
            {formatFeeAmount(course.feeInclGst)}
          </span>{" "}
          <span className="type-body text-grey">incl. GST</span>
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
