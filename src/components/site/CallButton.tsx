import { Phone } from "lucide-react";
import { ButtonLink } from "@/components/site/Button";
import { formatPhone, telHref } from "@/lib/format";
import { cn } from "@/lib/utils";

interface CallButtonProps {
  /**
   * Required, and read from settings by the caller. It used to default to a module constant, which
   * stopped being possible when the number moved to Sanity: this component is rendered inside the
   * mobile sheet, which is a Client Component and cannot await it.
   */
  phone: string;
  children?: React.ReactNode;
  className?: string;
  size?: "default" | "sm" | "icon" | "block";
  variant?: "secondary" | "dark" | "light" | "secondary-on-dark";
  event?: string;
}

export function CallButton({
  phone,
  children,
  className,
  size = "default",
  variant = "secondary",
  event = "call_click",
}: CallButtonProps) {
  const iconOnly = size === "icon";
  return (
    <ButtonLink
      href={telHref(phone)}
      variant={variant}
      size={size}
      className={cn(className)}
      data-event={event}
      aria-label={iconOnly ? `Call the academy on ${formatPhone(phone)}` : undefined}
    >
      <Phone className="size-5" aria-hidden="true" />
      {iconOnly ? null : (children ?? "Call")}
    </ButtonLink>
  );
}
