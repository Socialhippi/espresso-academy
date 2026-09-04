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
          className="-m-1 flex shrink-0 items-center gap-3 p-1"
          aria-label="Espresso Academy India, home"
        >
          <LogoMark className="h-9 w-auto md:h-10" sizes="(min-width: 768px) 40px, 36px" priority />
          <span className="hidden text-body font-medium tracking-wide text-black sm:inline">
            Espresso Academy India
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
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
            className="hidden md:inline-flex"
            data-event="enquire_click_header"
          >
            Enquire
          </ButtonLink>
          <div className="md:hidden">
            <MobileNav />
          </div>
        </div>
      </Container>
    </header>
  );
}
