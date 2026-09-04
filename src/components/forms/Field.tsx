import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Form field shell, per design.md and .claude/rules/a11y.md: label above, 16px text,
 * white-3 ground, 1px white-2 border, blue focus ring from the global :focus-visible rule,
 * and red-deep error text with an icon, adjacent to the control and wired by aria-describedby.
 */

export const fieldControlClass =
  "w-full rounded-xs border border-white-2 bg-white-3 px-3 text-body text-black " +
  "placeholder:text-grey transition-[color,background-color,border-color] duration-200 " +
  "aria-[invalid=true]:border-red-deep aria-[invalid=true]:bg-white";

export const fieldInputClass = cn(fieldControlClass, "h-12");

interface FieldProps {
  id: string;
  label: string;
  /** Adds "(required)" to the visible label text, per a11y.md. */
  required?: boolean;
  /** Shown under the label, before the control. */
  hint?: ReactNode;
  hintId?: string;
  error?: string;
  errorId?: string;
  children: ReactNode;
  className?: string;
}

export function Field({
  id,
  label,
  required = false,
  hint,
  hintId,
  error,
  errorId,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="type-label text-grey">
        {label} {required ? "(required)" : "(optional)"}
      </label>
      {hint && (
        <p id={hintId} className="type-small text-grey">
          {hint}
        </p>
      )}
      {children}
      <FieldError id={errorId} message={error} />
    </div>
  );
}

interface FieldErrorProps {
  id?: string;
  message?: string;
}

/**
 * Always in the DOM, and always the same height, so the live region can announce a message
 * appearing in it and so showing an error on blur does not push the next field out from under
 * the reader's finger.
 */
export function FieldError({ id, message }: FieldErrorProps) {
  return (
    <p id={id} aria-live="polite" className="min-h-5">
      {message && (
        <span className="flex items-center gap-2 type-small text-red-deep">
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          {message}
        </span>
      )}
    </p>
  );
}
