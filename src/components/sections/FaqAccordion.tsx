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
          <AccordionTrigger className="gap-6 rounded-none py-5 type-h3 text-black hover:no-underline hover:text-red **:data-[slot=accordion-trigger-icon]:size-5 **:data-[slot=accordion-trigger-icon]:text-red">
            {faq.q}
          </AccordionTrigger>
          <AccordionContent className="pb-6">
            <p className="measure type-body text-grey">{faq.a}</p>
            {faq.link && (
              <p className="mt-4">
                <Link
                  href={faq.link.href}
                  className="type-body text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
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
