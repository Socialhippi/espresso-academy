import Link from "next/link";
import { Container } from "@/components/site/Container";
import { LogoMark } from "@/components/site/Logo";
import { MobileNav } from "@/components/site/MobileNav";
import { NavLink } from "@/components/site/NavLink";
import { ButtonLink } from "@/components/site/Button";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { primaryNav } from "@/lib/nav";

/**
 * Server Component. Only the mobile sheet and the active-link marker are client-side.
 * Sticky from md up, where there is no bottom bar carrying the actions instead.
 */
export function Header() {
  return (
    <header className="relative z-40 border-b border-white-2 bg-white md:sticky md:top-0">
      <Container className="flex items-center justify-between gap-4 py-3">
        {/*
          A horizontal lockup. design.md assumes one exists ("Header: horizontal lockup 32px
          tall"), but the only supplied lockup is stacked and roughly square: at a header-sized
          48px its wordmark renders about 5.6px tall and "INDIA" about 3.2px, so the academy's
          name is illegible. Reaching a readable 9px wordmark would need a 78px logo and a 95px
          header, which is far too heavy for a 64% mobile audience.

          So the header pairs the supplied standalone mark with the name set in Montserrat. The
          artwork itself is untouched: no crop, recolour or rotation. Composing a new lockup is a
          brand decision, so it is logged in docs/STATUS.md for client sign-off, and the full
          stacked lockup still runs in the footer where 80px gives the wordmark room to read.
        */}
        <Link
          href="/"
          className="-m-1.5 flex shrink-0 items-center gap-2 p-1.5 md:gap-3"
          aria-label="Espresso Academy India, home"
        >
          <LogoMark className="h-8 w-auto shrink-0 md:h-10" sizes="(min-width: 768px) 40px, 32px" priority />
          {/* Shown at every width. Hiding it on mobile would leave the mark alone, which is the
              exact legibility problem this composition exists to solve. */}
          <span className="text-body font-medium tracking-wide whitespace-nowrap text-black">
            Espresso Academy India
          </span>
        </Link>

        {/* lg, not md: at 768 the six nav items plus the two actions leave the brand lockup nothing to
            sit in, and it collapses on top of the navigation. */}
        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-6 lg:gap-8">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href}>{item.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          <WhatsAppButton size="icon" event="whatsapp_click_header" />
          <ButtonLink
            href="/enquire"
            variant="primary"
            size="sm"
            className="hidden lg:inline-flex"
            data-event="enquire_click_header"
          >
            Enquire
          </ButtonLink>
          <div className="lg:hidden">
            <MobileNav />
          </div>
        </div>
      </Container>
    </header>
  );
}
