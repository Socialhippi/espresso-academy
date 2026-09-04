import { cn } from "@/lib/utils";
import { TBC_TITLE } from "@/lib/format";

interface TbcPillProps {
  className?: string;
  /** Overrides the visible text, e.g. "Dates TBC". The title attribute stays the same. */
  label?: string;
}

/**
 * The one honest stand-in for a value the client has not sent yet. Never replace it with a
 * plausible-looking number: content/facts.md is the only source of a fact on this site.
 */
export function TbcPill({ className, label = "TBC" }: TbcPillProps) {
  return (
    <span
      title={TBC_TITLE}
      className={cn(
        "inline-flex items-center rounded-pill bg-white-2 px-3 py-1 type-label text-black",
        className,
      )}
    >
      {label}
      <span className="sr-only"> ({TBC_TITLE})</span>
    </span>
  );
}

interface TbcValueProps {
  /** The confirmed value, or null while the client has not sent it. */
  value: string | number | null | undefined;
  /** Text inside the pill when the value is missing, e.g. "Dates TBC". */
  fallbackLabel?: string;
  /**
   * Styles the confirmed value only, never the pill. Callers set a ground-appropriate colour here
   * (white in the footer, black on white sections); pushing that onto the pill would override its
   * own black-on-white-2 pairing and, on a dark ground, make it unreadable.
   */
  className?: string;
}

/** Renders the real value when it exists and the TBC pill when it does not. */
export function TbcValue({ value, fallbackLabel, className }: TbcValueProps) {
  if (value === null || value === undefined || value === "") {
    return <TbcPill label={fallbackLabel} />;
  }
  return <span className={className}>{value}</span>;
}
