import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { FaqItem } from "@/lib/content";
import { cn } from "@/lib/utils";

interface FaqAccordionProps {
  items: FaqItem[];
  className?: string;
  /** Opens the first question by default. */
  defaultOpenFirst?: boolean;
}

/**
 * `hiddenUntilFound` keeps every answer in the DOM when its panel is collapsed, so the copy is
 * crawlable, matches the FAQPage JSON-LD and is reachable by find-in-page. Base UI handles the
 * keyboard and ARIA wiring.
 *
 * Sizes here are `text-*`, not the `type-*` utilities used elsewhere. The shadcn trigger carries
 * `text-sm`, and the class merger cannot tell that a custom `@utility` named `type-h3` is a font
 * size, so it keeps both and CSS order decides: the question rendered at 14px, smaller than its own
 * 16px answer. Anything handed to a component in src/components/ui/ has to use a name the merger
 * knows. Same reason for the transition: shadcn's `transition-all` fades the focus ring in.
 */
export function FaqAccordion({ items, className, defaultOpenFirst = false }: FaqAccordionProps) {
  if (items.length === 0) return null;

  return (
    <Accordion
      hiddenUntilFound
      defaultValue={defaultOpenFirst ? [0] : []}
      className={cn("border-t border-white-2", className)}
    >
      {items.map((faq) => (
        <AccordionItem key={faq.q} className="border-b border-white-2">
          <AccordionTrigger
            data-event="faq_expand"
            data-question={faq.q}
            className="gap-6 rounded-none py-5 text-h3 font-medium text-black transition-[color,background-color,border-color] hover:text-red hover:no-underline md:text-h3-lg **:data-[slot=accordion-trigger-icon]:size-5 **:data-[slot=accordion-trigger-icon]:text-red">
            {faq.q}
          </AccordionTrigger>
          <AccordionContent className="pb-6">
            <p className="measure type-body text-grey">{faq.a}</p>
            {faq.link && (
              <p className="mt-4">
                <Link
                  href={faq.link.href}
                  className="inline-flex min-h-11 items-center type-body text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
                >
                  {faq.link.label}
                </Link>
              </p>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
