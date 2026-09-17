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

/**
 * One ladder now, not two.
 *
 * Revision 2 of content/facts.md removed the SCA courses: the client's document describes the SCA
 * as a standards body and lists no SCA course the academy runs. A second ladder with nothing on it
 * would have been the site claiming a pathway it does not sell.
 */
const rungs: Level[] = ["basic", "advanced"];

interface RungProps {
  level: Level;
  current: boolean;
  onDark: boolean;
}

async function Rung({ level, current, onDark }: RungProps) {
  const courses = await getCoursesByLevel(level);
  const first = courses[0];
  const label = levelBadge[level].label;

  const body = (
    <span
      className={cn(
        // min-w-0 again: this is the flex child that actually holds the badge, and without it the
        // rung cannot shrink below the badge's own width.
        "flex min-h-11 min-w-0 flex-1 flex-col justify-center gap-2 border p-4 transition-[color,background-color,border-color] duration-200",
        onDark ? "border-black-2" : "border-white-2",
        current && (onDark ? "bg-black-2" : "bg-white-3"),
        first && !onDark && "hover:border-black",
        first && onDark && "hover:border-white",
      )}
    >
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <LevelBadge level={level} />
        {/* type-body on the light ground: design.md's 16px floor under red text. On the dark rung
            it stays a label, because there the colour is white and the floor is about red. */}
        {current && (
          <span
            className={cn(
              "whitespace-nowrap",
              onDark ? "type-label text-white" : "type-body font-medium text-red",
            )}
          >
            You are here
          </span>
        )}
      </span>
      <span className={cn("type-small text-balance", onDark ? "text-grey-2" : "text-grey")}>
        {/* With two Advanced courses the count is the useful thing to say; with one it is the
            title, because "1 course" tells a reader nothing they cannot see. */}
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
      // min-w-0: without it the rung inherits min-width:auto and cannot shrink below its badge,
      // which pushed the whole document 17px wide at 768.
      className="flex min-w-0 flex-1"
    >
      {body}
    </Link>
  );
}

/**
 * IBC Basic, then IBC Advanced. The visual ladder is exposed as a labelled group and backed by the
 * plain-prose equivalent below it, per .claude/rules/a11y.md.
 */
export function LevelLadder({ current, className, onDark = false, id }: LevelLadderProps) {
  /* Rung is async because it reads the courses at that level. React renders an async child in a
     Server Component tree directly, so the ladder itself stays synchronous. */
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
        aria-label="The Italian Barista Certificate ladder"
        aria-describedby={describedBy}
        className="flex flex-col gap-6"
      >
        <div>
          <p className={cn("type-label", onDark ? "text-grey-2" : "text-grey")}>
            Italian Barista Certificate
          </p>
          <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-stretch">
            {rungs.map((level, index) => (
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
        The Italian Barista Certificate runs at two levels. IBC Basic is four days and assumes no
        machine experience. Above it sit two Advanced courses, Advanced Barista and Advanced
        Roasting, of two days each. The two Advanced courses are separate, and the academy is
        confirming what each one assumes you can already do.
        {/* Guarded for the same reason LevelBadge is: `current` comes from a ?level= parameter
            and from a Sanity string field, and the set of levels shrank in revision 2. */}
        {current ? ` You are looking at the ${levelBadge[current]?.label ?? current} level.` : ""}
      </p>
    </div>
  );
}
