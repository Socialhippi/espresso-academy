import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LevelBadge } from "@/components/site/LevelBadge";
import { SanityPhoto } from "@/components/site/SanityPhoto";
import { EX_GST, feeInclGst, formatDate, formatDuration, formatFeeAmount, INCL_GST } from "@/lib/format";
import {
  courseCta,
  courseFeeExGst,
  formatLabel,
  getNextInstanceForCourse,
  type Course,
} from "@/lib/content";
import { cn } from "@/lib/utils";

interface CourseCardProps {
  course: Course;
  className?: string;
  /** Set on the first card in a grid so its photo is not lazy-loaded. */
  priority?: boolean;
}

/**
 * The whole card is one link, per .claude/rules/a11y.md. Hover underlines the title and shifts the
 * arrow 4px; nothing scales. The level badge sits under the photo rather than over it, because
 * text never sits on top of an image.
 *
 * The hover reveal is the card's own affordance and never its content. .claude/rules/a11y.md says
 * "No hover-only content", so every word on this card is present at every moment: on a phone that
 * cannot hover, and to a screen reader that does not. What arrives on hover is a red rule drawing
 * out from under the arrow across the foot of the card — design.md's "underline draws" — and the
 * picture coming up to full saturation from a resting 90%. `:focus-visible` on the link drives
 * both, so a keyboard sees exactly what a pointer sees.
 *
 * A course with a bookable batch also gets a second link below the card body, outside the card
 * link because a link cannot contain a link. It is the only card state that shows one: everything
 * else has nothing to charge for, and the card link already leads to the page that asks. Without
 * it the hub was eight cards deep with no route to a checkout on any of them.
 */
export function CourseCard({ course, className, priority = false }: CourseCardProps) {
  const nextInstance = getNextInstanceForCourse(course);
  /* After any offer. `course.feeExGst` is the standard fee now, and a card quoting it would be
     quoting a price the checkout does not charge. */
  const fee = courseFeeExGst(course);
  const hasFee = fee !== null;
  const total = feeInclGst({ exGst: fee, gstRate: course.gstRate });
  const cta = courseCta(course, course.instances);
  const hasDuration = course.durationDays !== null || course.durationHours !== null;
  /* Same rule as the course page's spec strip: a cell appears when it has something to say, and
     one sentence covers the rest. `prerequisites`, `trainers` and `days` are not shown on a
     card, but they decide whether the card has anything specific to offer at all. */
  const allSpecsUnknown =
    !hasDuration &&
    !hasFee &&
    course.format === null &&
    !nextInstance?.startDate &&
    course.prerequisites === null &&
    course.trainers.length === 0 &&
    (course.days === null || course.days.length === 0);

  return (
    /* The article is the flex column, not the link inside it. With `h-full` on the link and a
       book band as its sibling, the band painted *below* the grid row: 44px of overhang at 1280
       and a 12px collision with the next row at 768. The border lives out here too, so hovering
       either half outlines the whole card instead of splitting it into a black box with a grey
       tray under it. */
    <article
      className={cn(
        "flex h-full flex-col border border-white-2 bg-white transition-[border-color] duration-200 has-[a:hover]:border-black",
        className,
      )}
    >
      <Link
        href={`/courses/${course.slug}`}
        // `group/card`, not `group`: on the bare name the book band below counted as part of the
        // group, so hovering it underlined the title and shifted the arrow — the card signalling
        // "open the course page" while the pointer was on a link to a checkout.
        className="card-link group/card flex flex-1 flex-col"
      >
        <div className="relative">
          <SanityPhoto
            image={course.heroImage}
            slot={`course-${course.slug}`}
            fallbackAlt={course.heroAlt}
            aspect="photo"
            priority={priority}
            sizes="(min-width: 1024px) 380px, (min-width: 768px) 45vw, 90vw"
            className="card-photo"
            placeholderClassName="card-photo rounded-none border-0 border-b"
          />
        </div>

        <div className="flex flex-1 flex-col p-6">
          <LevelBadge level={course.level} className="self-start" />

          <h3 className="mt-4 type-h3 text-black group-hover/card:underline group-hover/card:decoration-1 group-hover/card:underline-offset-4">
            {course.title}
          </h3>

          <p className="mt-2 type-body text-grey">{course.outcome}</p>

          {/*
            When the academy has confirmed nothing, four grey pills per card times eight cards is
            thirty-two pills across the hub, and the unknowns end up dominating the card. One line
            says the same thing. The full spec row returns the moment any value lands.
          */}
          {allSpecsUnknown ? (
            <p className="mt-4 type-small text-grey">
              Fee, dates and duration are confirmed on WhatsApp before you pay
            </p>
          ) : (
            <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 type-small text-grey">
              {hasDuration && (
                <li className="flex items-center gap-2">
                  <span className="type-label text-grey">Duration</span>
                  <span className="text-black">
                    {formatDuration(course.durationDays, course.durationHours)}
                  </span>
                </li>
              )}
              {course.format && (
                <li className="flex items-center gap-2">
                  <span className="type-label text-grey">Format</span>
                  <span className="text-black">{formatLabel[course.format]}</span>
                </li>
              )}
            </ul>
          )}

          <p className="mt-3 type-small text-grey">
            <span className="block type-label text-grey">Certificate</span>
            <span className="mt-1 block text-black">
              {course.certificateAwardedLabel ?? "No certificate is issued for this course"}
            </span>
          </p>

          <div className="mt-auto flex items-end justify-between gap-4 pt-6">
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
              {hasFee && (
                <p>
                  <span className="block type-label text-grey">Fee</span>
                  {/*
                    The suffix sits with the figure, not two elements below it. It used to hang
                    under the whole row, past the next-batch date and the arrow, so a reader
                    scanning the card met a bare ₹26,700 and had to look for its basis. A price
                    without a basis is the one thing .claude/rules/content.md will not have.

                    The strike-through still belongs on the course page, where there is room to
                    say what the offer is. A crossed-out number on a card with no reason beside it
                    is the thing design.md calls a sales trick.
                  */}
                  <span className="type-numeral text-h2 text-black">{formatFeeAmount(fee)}</span>{" "}
                  <span className="type-small text-grey">{EX_GST}</span>
                </p>
              )}
              {nextInstance?.startDate && (
                <p>
                  <span className="block type-label text-grey">Next batch</span>
                  <time
                    dateTime={nextInstance.startDate}
                    className="type-numeral text-h2 text-black"
                  >
                    {formatDate(nextInstance.startDate)}
                  </time>
                </p>
              )}
            </div>
            <ArrowRight
              className="size-6 shrink-0 text-red transition-transform duration-200 ease-out-brand group-hover/card:translate-x-1"
              aria-hidden="true"
            />
          </div>

          {hasFee && total !== null && (
            <p className="mt-2 type-small text-grey">
              {formatFeeAmount(total)} {INCL_GST}
            </p>
          )}

          {/* Last in the body, so the rule closes the card under whichever line the card ended on.
              Decoration, and announced as nothing: it says "this card is a link", which the card
              already said in the accessibility tree. */}
          <span aria-hidden="true" className="card-rail mt-4" />
        </div>
      </Link>

      {(cta.kind === "book" || cta.kind === "choose") && (
        /*
         * `choose` belongs here as much as `book` does. The band was gated on `book` alone, which
         * `courseCta` returns only when exactly one batch is bookable — so the day the IBC Basic
         * got its three September and October batches the hub lost the only route to a checkout it
         * had, on the only course that can be paid for. The href follows `cta`, so one bookable
         * batch still goes straight to its checkout and several scroll to the table.
         */
        <Link
          href={cta.href}
          data-event="book_click_card"
          /* Sentence case at body size: this is the only route to a checkout on the hub, and
             design.md puts a 16px floor under red text. */
          className="flex min-h-12 items-center justify-center border-t border-white-2 bg-white-3 px-6 py-3 type-body font-medium text-red hover:bg-red hover:text-white focus-visible:bg-red focus-visible:text-white"
        >
          {cta.label}
          <span className="sr-only">: {course.title}</span>
        </Link>
      )}
    </article>
  );
}
