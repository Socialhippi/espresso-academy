import { Phone } from "lucide-react";
import { ButtonLink } from "@/components/site/Button";
import { siteSettings } from "@/lib/content";
import { formatPhone, telHref } from "@/lib/format";
import { cn } from "@/lib/utils";

interface CallButtonProps {
  /** Defaults to the primary number published on the current site. */
  phone?: string;
  children?: React.ReactNode;
  className?: string;
  size?: "default" | "sm" | "icon" | "block";
  variant?: "secondary" | "dark" | "light" | "secondary-on-dark";
  event?: string;
}

export function CallButton({
  phone = siteSettings.phonePrimary,
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
