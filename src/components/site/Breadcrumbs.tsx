import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/site/JsonLd";
import { absoluteUrl } from "@/lib/env";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  /** Everything after Home, in order. The last entry is the current page. */
  items: Crumb[];
  className?: string;
}

/**
 * Visible breadcrumbs plus the matching BreadcrumbList, which seo.md requires on every page
 * below home. Home is prepended here so callers never have to repeat it.
 */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const trail: Crumb[] = [{ label: "Home", href: "/" }, ...items];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      item: absoluteUrl(crumb.href),
    })),
  };

  return (
    <>
      <nav aria-label="Breadcrumb" className={cn("type-small", className)}>
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-grey">
          {trail.map((crumb, index) => {
            const isCurrent = index === trail.length - 1;
            return (
              <li key={crumb.href} className="flex items-center gap-2">
                {index > 0 && (
                  <ChevronRight className="size-4 shrink-0 text-white-2" aria-hidden="true" />
                )}
                {isCurrent ? (
                  <span aria-current="page" className="text-black">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="underline decoration-white-2 underline-offset-4 hover:text-red hover:decoration-red"
                  >
                    {crumb.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={jsonLd} id="breadcrumb-jsonld" />
    </>
  );
}
