import { TbcPill } from "@/components/site/TbcPill";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { EX_GST, formatFeeAmount, formatDate, feeInclGst, INCL_GST } from "@/lib/format";
import { ADVANCE_RUPEES } from "@/lib/booking-terms";
import { courseCta, courseFeeExGst, feeForInstance, hasLiveOffer, type Course } from "@/lib/content";
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
 * The client quotes ex-GST, so the ex-GST figure leads and the tax-inclusive total sits under it.
 * That order is deliberate: a reader comparing this page against the academy's own brochure or a
 * WhatsApp quote is looking for the number they were given, and the total is what they will
 * actually pay. Before the rate was confirmed the total was simply absent, which is the same
 * component with one field null.
 */
export function FeeBlock({ course, className }: FeeBlockProps) {
  const cta = courseCta(course, course.instances);
  const bookable = cta.instanceId
    ? course.instances.find((instance) => instance.id === cta.instanceId)
    : undefined;
  const batchFee = bookable ? feeForInstance(course, bookable) : null;
  /*
   * Whether this batch sets its own price, which is not the same as whether a batch was found.
   * `feeForInstance` falls back to the course fee, so `batchFee` is non-null for any bookable
   * batch, and both the "for the 15 Sept batch" qualifier and the offer suppression below were
   * keyed on it. The Advanced Roasting page read "₹30,000 + GST for the 15 Sept 2026 batch" for a
   * price that is simply the course's, and an offer would have been hidden on any course with
   * exactly one bookable batch.
   */
  const batchOverride = bookable?.priceOverrideExGst ?? null;
  /* `course.feeExGst` is the standard fee now, and the offer fee is what the checkout charges.
     Reading the standard one here quoted ₹35,600 on a page whose Book button takes a slice of
     ₹26,700, and derived the balance from the wrong total. */
  const fee = batchFee ?? courseFeeExGst(course);
  const hasFee = fee !== null;
  const total = feeInclGst({ exGst: fee, gstRate: course.gstRate });
  /* Named, because a batch price is that batch's price and not the course's. */
  const qualifier =
    batchOverride !== null && bookable?.startDate
      ? `for the ${formatDate(bookable.startDate)} batch`
      : null;

  /* An offer only makes sense against the course's own standard fee. A batch override is a
     different price for a different cohort, not a discount off this one, so the strike-through
     goes away with it rather than claiming a saving nobody is getting. */
  const showsOffer = hasFee && batchOverride === null && hasLiveOffer(course) && course.offerLabel;
  const standardTotal = showsOffer
    ? feeInclGst({ exGst: course.feeExGst, gstRate: course.gstRate })
    : null;
  /* What a booking actually leaves outstanding. The advance is capped at the payable, so a
     hypothetical batch priced under ₹5,000 reports no balance rather than a negative one. */
  const payable = total ?? fee;
  const balance = payable === null ? null : Math.max(0, payable - Math.min(ADVANCE_RUPEES, payable));

  return (
    <div className={cn("border border-white-2 bg-white-3 p-6 md:p-8", className)}>
      <p className="type-label text-grey">Fee</p>

      {hasFee ? (
        <>
          <p className="mt-3">
            <span className="type-numeral text-display text-black">{formatFeeAmount(fee)}</span>{" "}
            <span className="type-body text-grey">
              {EX_GST}
              {qualifier ? ` ${qualifier}` : ""}
            </span>
          </p>

          {total !== null && (
            <p className="mt-2 type-body text-black">
              {formatFeeAmount(total)} including GST at {course.gstRate}%
            </p>
          )}

          {showsOffer && (
            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
              {/* The strike-through is decoration to a screen reader, so the relationship is
                  said in words rather than drawn. */}
              <span className="sr-only">Usual price</span>
              <s className="type-body text-grey">
                {formatFeeAmount(course.feeExGst)} {EX_GST}
                {standardTotal !== null ? `, ${formatFeeAmount(standardTotal)} ${INCL_GST}` : ""}
              </s>
              {/* Black on red-tint, not red text: design.md puts a 16px floor under red type and
                  this label is 12px. red-tint is the token for exactly this kind of chip. */}
              <span className="inline-flex items-center rounded-xs bg-red-tint px-3 py-1 type-label text-black">
                {course.offerLabel}
              </span>
            </p>
          )}
        </>
      ) : (
        <div className="mt-3 flex items-center gap-3">
          <TbcPill />
          {/* Every course carries a fee today. This is the state a new course starts in, and the
              state a batch with no price falls back to, not a state the catalogue is in. */}
          <p className="type-body text-black">The academy confirms the fee for each batch.</p>
        </div>
      )}

      {/* type-body, not type-small: design.md sets a 16px floor on mobile body copy, and the
          first item here is the sentence explaining that GST is charged on top of the figure
          above it. That is the last thing someone reads before deciding to pay. */}
      <ul className="mt-6 flex flex-col gap-3 type-body text-grey">
        {hasFee && course.gstRate === null && (
          /* Only while a course has no confirmed rate. Every course has 18% today, so this is the
             state the component falls back to rather than the state it is in. */
          <li>
            GST is charged on top of this figure. No tax-inclusive total is published for this
            course yet. Ask and you will be told the total before you pay anything.
          </li>
        )}
        {balance !== null && balance > 0 && (
          /* The fee is not the number a reader has to find today. ₹5,000 is. */
          <li>
            {formatFeeAmount(ADVANCE_RUPEES)} confirms your seat and comes off the fee. The
            balance, {formatFeeAmount(balance)}
            {total !== null ? " including GST" : ` ${EX_GST}`}, is paid at the
            academy before the first day.
          </li>
        )}
        <li>
          {/* Narrowed from "no certification body charges a separate fee", which said something
              about the SCA that content/facts.md does not, and which the certifications pages
              then contradicted. facts.md supports one thing here: the IBC is included. */}
          The Italian Barista Certificate is part of the fee. Nothing separate is charged for it.
        </li>
        {/* No EMI row. content/facts.md lists EMI among the claims the site may not make, and an
            "EMI: TBC" pill is not the absence of a claim: it puts financing on the page as an
            open question, which is how a reader learns to expect it. */}
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
