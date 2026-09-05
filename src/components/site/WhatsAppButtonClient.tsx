"use client";

/**
 * The WhatsApp button for the three places that are already Client Components: the error boundary,
 * the inline waitlist form and the enquiry form. Same markup as the server one; the number and the
 * message template come from `useSiteConfig` instead of from an `await`.
 */
import { ButtonLink } from "@/components/site/Button";
import { WhatsAppGlyph } from "@/components/site/WhatsAppGlyph";
import { whatsappUrl, type WhatsAppMessageOptions } from "@/lib/format";
import { useSiteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

interface WhatsAppButtonClientProps extends WhatsAppMessageOptions {
  children?: React.ReactNode;
  className?: string;
  size?: "default" | "sm" | "icon" | "block";
  event?: string;
}

export function WhatsAppButtonClient({
  children = "Ask on WhatsApp",
  className,
  size = "default",
  event = "whatsapp_click",
  course,
  batch,
  message,
  number,
  template,
}: WhatsAppButtonClientProps) {
  const config = useSiteConfig();
  const iconOnly = size === "icon";
  return (
    <ButtonLink
      href={whatsappUrl({
        course,
        batch,
        message,
        number: number ?? config.whatsappNumber,
        template: template ?? config.whatsappText,
      })}
      external
      variant="dark"
      size={size}
      className={cn(className)}
      data-event={event}
      data-course={course ?? undefined}
      aria-label={iconOnly ? "Message the academy on WhatsApp" : undefined}
    >
      <WhatsAppGlyph className="size-5" />
      {iconOnly ? null : children}
    </ButtonLink>
  );
}
