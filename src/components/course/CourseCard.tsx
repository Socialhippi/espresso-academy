import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LevelBadge } from "@/components/site/LevelBadge";
import { SanityPhoto } from "@/components/site/SanityPhoto";
import { formatDate, formatDuration, formatFeeAmount } from "@/lib/format";
import { courseCta, formatLabel, getNextInstanceForCourse, type Course } from "@/lib/content";
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
 * A course with a bookable batch also gets a second link below the card body, outside the card
 * link because a link cannot contain a link. It is the only card state that shows one: everything
 * else has nothing to charge for, and the card link already leads to the page that asks. Without
 * it the hub was eight cards deep with no route to a checkout on any of them.
 */
export function CourseCard({ course, className, priority = false }: CourseCardProps) {
  const nextInstance = getNextInstanceForCourse(course);
  const hasFee = course.feeInclGst !== null;
  const cta = courseCta(course, course.instances);
  const hasDuration = course.durationDays !== null || course.durationHours !== null;
  /* Same rule as the course page's spec strip: a cell appears when it has something to say, and
     one sentence covers the rest. `prerequisites`, `trainers` and `modules` are not shown on a
     card, but they decide whether the card has anything specific to offer at all. */
  const allSpecsUnknown =
    !hasDuration &&
    !hasFee &&
    course.format === null &&
    !nextInstance?.startDate &&
    course.prerequisites === null &&
    course.trainers.length === 0 &&
    (course.modules === null || course.modules.length === 0);

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
        className="group/card flex flex-1 flex-col"
      >
        <div className="relative">
          <SanityPhoto
            image={course.heroImage}
            slot={`course-${course.slug}`}
            fallbackAlt={course.heroAlt}
            aspect="photo"
            priority={priority}
            sizes="(min-width: 1024px) 380px, (min-width: 768px) 45vw, 90vw"
            placeholderClassName="rounded-none border-0 border-b"
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
                  <span className="type-numeral text-h2 text-black">
                    {formatFeeAmount(course.feeInclGst)}
                  </span>
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

          {hasFee && <p className="mt-2 type-small text-grey">incl. GST</p>}
        </div>
      </Link>

      {cta.kind === "book" && (
        <Link
          href={cta.href}
          data-event="book_click_card"
          /* 14px sentence case, not a 12px uppercase label: this is the only route to a checkout
             on the hub, and design.md puts a 16px floor under red text. */
          className="flex min-h-12 items-center justify-center border-t border-white-2 bg-white-3 px-6 py-3 type-small font-medium text-red hover:bg-red hover:text-white focus-visible:bg-red focus-visible:text-white"
        >
          {cta.label}
          <span className="sr-only">: {course.title}</span>
        </Link>
      )}
    </article>
  );
}
