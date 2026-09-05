import { ButtonLink } from "@/components/site/Button";
import { WhatsAppGlyph } from "@/components/site/WhatsAppGlyph";
import { getSiteSettings } from "@/lib/content";
import { whatsappUrl, type WhatsAppMessageOptions } from "@/lib/format";
import { cn } from "@/lib/utils";

interface WhatsAppButtonProps extends WhatsAppMessageOptions {
  /** Visible label. Keep it specific: "Ask on WhatsApp" beats "Contact us". */
  children?: React.ReactNode;
  className?: string;
  size?: "default" | "sm" | "icon" | "block";
  /** Distinguishes this button in analytics. */
  event?: string;
}

/**
 * Black ground with the glyph, per design.md: red stays singular on the page, so the second
 * action is never a second red pill.
 *
 * Async, because the number and the message template come from Sanity now. Reading them here
 * rather than taking them as props keeps fifteen call sites unchanged, and `getSiteSettings` is
 * memoised per request, so all fifteen share one fetch. Client Components cannot render this one;
 * they use `WhatsAppButtonClient`, which reads the same values from context.
 */
export async function WhatsAppButton({
  children = "Ask on WhatsApp",
  className,
  size = "default",
  event = "whatsapp_click",
  course,
  batch,
  message,
  number,
  template,
}: WhatsAppButtonProps) {
  const settings = await getSiteSettings();
  const iconOnly = size === "icon";
  return (
    <ButtonLink
      href={whatsappUrl({
        course,
        batch,
        message,
        number: number ?? settings.whatsappNumber,
        template: template ?? settings.whatsappText,
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
