import { ButtonLink } from "@/components/site/Button";
import { WhatsAppGlyph } from "@/components/site/WhatsAppGlyph";
import { whatsappUrl, type WhatsAppMessageOptions } from "@/lib/format";
import { cn } from "@/lib/utils";

interface WhatsAppButtonProps extends WhatsAppMessageOptions {
  /** Visible label. Keep it specific: "Ask on WhatsApp" beats "Contact us". */
  children?: React.ReactNode;
  className?: string;
  size?: "default" | "sm" | "icon" | "block";
  /** Distinguishes this button in analytics once GTM lands. */
  event?: string;
}

/**
 * Black ground with the glyph, per design.md: red stays singular on the page, so the second
 * action is never a second red pill. data-event is in place for the analytics phase.
 */
export function WhatsAppButton({
  children = "Ask on WhatsApp",
  className,
  size = "default",
  event = "whatsapp_click",
  course,
  batch,
  message,
}: WhatsAppButtonProps) {
  const iconOnly = size === "icon";
  return (
    <ButtonLink
      href={whatsappUrl({ course, batch, message })}
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
