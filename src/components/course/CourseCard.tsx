import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { LevelBadge } from "@/components/site/LevelBadge";
import { Placeholder } from "@/components/site/Placeholder";
import { TbcPill } from "@/components/site/TbcPill";
import { formatDate, formatDuration, formatFeeAmount } from "@/lib/format";
import { formatLabel, getNextInstanceForCourse, type Course } from "@/lib/content";
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
 */
export function CourseCard({ course, className, priority = false }: CourseCardProps) {
  const nextInstance = getNextInstanceForCourse(course);
  const hasFee = course.feeInclGst !== null;
  const hasDuration = course.durationDays !== null || course.durationHours !== null;

  return (
    <article className={cn("group h-full", className)}>
      <Link
        href={`/courses/${course.slug}`}
        className="flex h-full flex-col border border-white-2 bg-white transition-colors duration-200 hover:border-black"
      >
        <div className="relative">
          {course.heroImage ? (
            <Image
              src={course.heroImage}
              alt={course.heroAlt}
              width={1200}
              height={800}
              priority={priority}
              sizes="(min-width: 1024px) 380px, (min-width: 768px) 45vw, 90vw"
              className="aspect-photo w-full object-cover"
            />
          ) : (
            <Placeholder slot={`course-${course.slug}`} aspect="photo" className="rounded-none border-0 border-b" />
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <LevelBadge level={course.level} className="self-start" />

          <h3 className="mt-4 type-h3 text-black group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
            {course.title}
          </h3>

          <p className="mt-2 type-small text-grey">{course.outcome}</p>

          <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 type-small text-grey">
            <li className="flex items-center gap-2">
              <span className="type-label text-grey">Duration</span>
              {hasDuration ? (
                <span className="text-black">
                  {formatDuration(course.durationDays, course.durationHours)}
                </span>
              ) : (
                <TbcPill />
              )}
            </li>
            <li className="flex items-center gap-2">
              <span className="type-label text-grey">Format</span>
              {course.format ? (
                <span className="text-black">{formatLabel[course.format]}</span>
              ) : (
                <TbcPill />
              )}
            </li>
          </ul>

          <p className="mt-3 type-small text-grey">
            <span className="type-label text-grey">Certificate</span>{" "}
            <span className="text-black">
              {course.certificateAwardedLabel ?? "No certificate is issued for this course"}
            </span>
          </p>

          <div className="mt-auto flex items-end justify-between gap-4 pt-6">
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
              <p>
                <span className="block type-label text-grey">Fee</span>
                {hasFee ? (
                  <span className="type-numeral text-h2 text-black">
                    {formatFeeAmount(course.feeInclGst)}
                  </span>
                ) : (
                  <TbcPill className="mt-1" />
                )}
              </p>
              <p>
                <span className="block type-label text-grey">Next batch</span>
                {nextInstance?.startDate ? (
                  <time
                    dateTime={nextInstance.startDate}
                    className="type-numeral text-h2 text-black"
                  >
                    {formatDate(nextInstance.startDate)}
                  </time>
                ) : (
                  <TbcPill className="mt-1" />
                )}
              </p>
            </div>
            <ArrowRight
              className="size-6 shrink-0 text-red transition-transform duration-200 ease-out-brand group-hover:translate-x-1"
              aria-hidden="true"
            />
          </div>

          {hasFee && <p className="mt-2 type-small text-grey">incl. GST</p>}
        </div>
      </Link>
    </article>
  );
}
