import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { LevelBadge } from "@/components/site/LevelBadge";
import { getCoursesByLevel, levelBadge, type Level } from "@/lib/content";
import { cn } from "@/lib/utils";

interface LevelLadderProps {
  /** Marks the rung the reader is on, e.g. on a course page. */
  current?: Level;
  className?: string;
  /** Inverts the rules and text for the one black section. */
  onDark?: boolean;
  /** Makes the generated description id unique when two ladders share a page. */
  id?: string;
}

const scaRungs: Level[] = ["foundation", "intermediate", "professional"];
const ibcRungs: Level[] = ["junior", "advanced"];

interface RungProps {
  level: Level;
  current: boolean;
  onDark: boolean;
}

function Rung({ level, current, onDark }: RungProps) {
  const courses = getCoursesByLevel(level);
  const first = courses[0];
  const label = levelBadge[level].label;

  const body = (
    <span
      className={cn(
        "flex min-h-11 flex-1 flex-col justify-center gap-2 border p-4 transition-[color,background-color,border-color] duration-200",
        onDark ? "border-black-2" : "border-white-2",
        current && (onDark ? "bg-black-2" : "bg-white-3"),
        first && !onDark && "hover:border-black",
        first && onDark && "hover:border-white",
      )}
    >
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <LevelBadge level={level} />
        {current && (
          <span className={cn("type-label whitespace-nowrap", onDark ? "text-white" : "text-red")}>
            You are here
          </span>
        )}
      </span>
      <span className={cn("type-small", onDark ? "text-grey-2" : "text-grey")}>
        {courses.length === 1 && first
          ? first.title
          : `${courses.length} ${courses.length === 1 ? "course" : "courses"}`}
      </span>
    </span>
  );

  if (!first) return body;

  return (
    <Link
      href={courses.length === 1 ? `/courses/${first.slug}` : `/courses?level=${level}`}
      aria-label={`${label}: ${courses.length === 1 && first ? first.title : `${courses.length} courses`}`}
      className="flex flex-1"
    >
      {body}
    </Link>
  );
}

/**
 * Foundation to Professional on one row, the IBC pair on a second. The visual ladder is hidden
 * from assistive tech and replaced by the plain list below it, per .claude/rules/a11y.md.
 */
export function LevelLadder({ current, className, onDark = false, id }: LevelLadderProps) {
  const describedBy = `${id ?? "level-ladder"}-description`;
  return (
    <div className={className}>
      {/*
        The rungs are links, so the visual ladder cannot be aria-hidden: hiding a container that
        holds focusable children is an axe "aria-hidden-focus" failure and strands keyboard users
        on elements a screen reader will not announce. It is exposed as a labelled group instead,
        with the prose below as the text equivalent a11y.md asks for on a diagram.
      */}
      <div
        role="group"
        aria-label="The two certificate ladders"
        aria-describedby={describedBy}
        className="flex flex-col gap-6"
      >
        <div>
          <p className={cn("type-label", onDark ? "text-grey-2" : "text-grey")}>
            SCA Coffee Skills Program
          </p>
          <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-stretch">
            {scaRungs.map((level, index) => (
              <div key={level} className="flex min-w-0 flex-1 items-stretch gap-2">
                {index > 0 && (
                  <ChevronRight
                    className={cn(
                      "mt-4 hidden size-5 shrink-0 self-start md:block",
                      onDark ? "text-black-2" : "text-white-2",
                    )}
                  />
                )}
                <Rung level={level} current={current === level} onDark={onDark} />
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className={cn("type-label", onDark ? "text-grey-2" : "text-grey")}>
            Italian Barista Certificate
          </p>
          <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-stretch">
            {ibcRungs.map((level, index) => (
              <div key={level} className="flex min-w-0 flex-1 items-stretch gap-2">
                {index > 0 && (
                  <ChevronRight
                    className={cn(
                      "mt-4 hidden size-5 shrink-0 self-start md:block",
                      onDark ? "text-black-2" : "text-white-2",
                    )}
                  />
                )}
                <Rung level={level} current={current === level} onDark={onDark} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <p id={describedBy} className="sr-only">
        The SCA Coffee Skills Program runs from Foundation to Intermediate to Professional. The
        Italian Barista Certificate runs from Junior to Advanced. The two ladders are separate; you
        do not have to finish one before starting the other, and you do not have to start at the
        bottom of either.
        {current ? ` You are looking at the ${levelBadge[current].label} level.` : ""}
      </p>
    </div>
  );
}
