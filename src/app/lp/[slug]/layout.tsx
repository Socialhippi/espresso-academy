import type { ReactNode } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/site/Logo";
import { Container } from "@/components/site/Container";
import { getSiteSettings } from "@/lib/content";
import { formatPhone, telHref } from "@/lib/format";

/**
 * The campaign shell: a logo and a phone number, and nothing else.
 *
 * A landing page exists to convert paid traffic, and every link out of it is a way to leave
 * without converting. The site header carries six navigation items, two actions and a mobile
 * sheet; none of that belongs here. The phone number stays because somebody who would rather ring
 * is not a leak, they are the conversion.
 *
 * This is a route-group layout rather than a flag on the page, so no future section can
 * accidentally render the full header inside a campaign.
 */
export default async function LandingPageLayout({ children }: { children: ReactNode }) {
  const settings = await getSiteSettings();

  return (
    <>
      <header className="border-b border-white-2 bg-white">
        <Container className="flex items-center justify-between gap-4 py-3">
          <Link
            href="/"
            className="-m-1.5 flex min-w-0 items-center gap-2 p-1.5 md:gap-3"
            aria-label="Espresso Academy India, home"
          >
            <LogoMark className="h-8 w-auto shrink-0 md:h-10" sizes="(min-width: 768px) 40px, 32px" priority />
            <span className="text-small font-medium tracking-wide text-black max-sm:text-balance sm:whitespace-nowrap md:text-body">
              Espresso Academy India
            </span>
          </Link>

          <a
            href={telHref(settings.phonePrimary)}
            data-event="call_click_lp"
            className="inline-flex min-h-11 shrink-0 items-center type-body font-medium text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
          >
            {formatPhone(settings.phonePrimary)}
          </a>
        </Container>
      </header>

      {children}

      {/* The minimum a page that collects a phone number owes a reader. Not the site footer:
          that is four columns of navigation, which is what this page exists to avoid. */}
      <div className="border-t border-white-2 bg-white">
        <Container className="flex flex-wrap items-center gap-x-6 gap-y-2 py-6 type-small text-grey">
          <span>
            &copy; {new Date().getFullYear()} {settings.legalName ?? settings.name}
          </span>
          <Link
            href="/privacy"
            className="inline-flex min-h-11 items-center text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="inline-flex min-h-11 items-center text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
          >
            Terms
          </Link>
          <Link
            href="/refund-policy"
            className="inline-flex min-h-11 items-center text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
          >
            Refund policy
          </Link>
        </Container>
      </div>
    </>
  );
}
