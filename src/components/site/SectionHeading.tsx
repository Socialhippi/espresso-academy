import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  /** Two-digit section numeral, e.g. "01". Rendered in Bebas beside the eyebrow label. */
  number?: string;
  /** The red uppercase label, e.g. "Courses". */
  eyebrow?: string;
  title: ReactNode;
  /** 2 by default. Never skip a level: seo.md and a11y.md both check heading order. */
  as?: "h2" | "h3";
  /** Standfirst under the heading. */
  description?: ReactNode;
  /** Inverts the eyebrow and rules for the one black section, where red text is forbidden. */
  onDark?: boolean;
  /** Draws the 1px rule that opens the section. */
  rule?: boolean;
  /** Right-hand action, e.g. a "See all" link. Sits beside the heading from md up. */
  action?: ReactNode;
  id?: string;
  className?: string;
}

/**
 * The section opener from design.md: a hairline, a numbered red eyebrow, then the heading.
 * Left-aligned by design; nothing on this site is centred by default.
 */
export function SectionHeading({
  number,
  eyebrow,
  title,
  as: Heading = "h2",
  description,
  onDark = false,
  rule = true,
  action,
  id,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        rule && (onDark ? "hairline-on-dark pt-6" : "hairline pt-6"),
        className,
      )}
    >
      {/* items-baseline, not items-end: with items-end the action floated to the middle of a
          section that had a description and sat under the heading on one that did not. */}
      <div className="flex flex-col gap-4 md:flex-row md:items-baseline md:justify-between md:gap-8">
        <div className="min-w-0">
          {(eyebrow || number) && (
            <p className={cn("eyebrow", onDark && "eyebrow-on-dark")}>
              {number && (
                <span className="type-numeral text-h3-lg leading-none" aria-hidden="true">
                  {number}
                </span>
              )}
              {eyebrow}
            </p>
          )}
          <Heading
            id={id}
            className={cn(
              "mt-3 type-h2",
              onDark ? "text-white" : "text-black",
              Heading === "h3" && "type-h3",
            )}
          >
            {title}
          </Heading>
          {description && (
            <p
              className={cn(
                "mt-4 measure type-body",
                onDark ? "text-grey-2" : "text-grey",
              )}
            >
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
