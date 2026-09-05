import Link from "next/link";
import { Container } from "@/components/site/Container";
import { LogoMark } from "@/components/site/Logo";
import { MobileNav } from "@/components/site/MobileNav";
import { NavLink } from "@/components/site/NavLink";
import { ButtonLink } from "@/components/site/Button";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { getSiteSettings } from "@/lib/content";
import { primaryNav } from "@/lib/nav";

/**
 * Server Component. Only the mobile sheet and the active-link marker are client-side.
 * Sticky from md up, where there is no bottom bar carrying the actions instead.
 */
export async function Header() {
  const settings = await getSiteSettings();

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
          /* shrink-0 only from sm. Below that the row cannot fit on one line at all, and letting
             the name wrap to two is better than pushing the document sideways. The mark carries
             its own shrink-0, so it never squashes against its 682:1000 ratio. */
          className="-m-1.5 flex min-w-0 items-center gap-2 p-1.5 sm:shrink-0 md:gap-3"
          aria-label="Espresso Academy India, home"
        >
          <LogoMark className="h-8 w-auto shrink-0 md:h-10" sizes="(min-width: 768px) 40px, 32px" priority />
          {/* Shown at every width. Hiding it on mobile would leave the mark alone, which is the
              exact legibility problem this composition exists to solve.

              14px below md, because at 16px the row measured 369px and pushed the document 9px
              sideways on every route at 360, the commonest Android width in this site's market.
              390 and 375 were both clean, which is why it went unseen. */}
          <span className="text-small font-medium tracking-wide text-black max-sm:text-balance sm:whitespace-nowrap md:text-body">
            Espresso Academy India
          </span>
        </Link>

        {/* nav (1080), not md and not lg: at 768 the six nav items plus the two actions leave the
            brand lockup nothing to sit in and it collapses on top of the navigation, and at lg
            (1024) the row is 2px wider than the viewport, which clips the Enquire pill and eats
            the right gutter. 1080 is the first width where the whole row fits with its gutters. */}
        <nav aria-label="Primary" className="hidden nav:block">
          <ul className="flex items-center gap-6 nav:gap-8">
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
            /* md, not nav: the sticky bottom bar stops at md, so from 768 up the header carries
               the only persistent primary call to action. Moving this to lg alongside the nav
               left 768 to 1023 with no visible Enquire anywhere, only a WhatsApp icon and a
               burger. The pill on its own is 101px and fits at 768 with room to spare. */
            className="hidden md:inline-flex"
            data-event="enquire_click_header"
          >
            Enquire
          </ButtonLink>
          <div className="nav:hidden">
            {/* The sheet is a Client Component, so the address and hours it prints are passed in
                rather than read: it cannot await Sanity itself. */}
            <MobileNav
              phone={settings.phonePrimary}
              address={settings.address}
              hours={settings.hours}
            />
          </div>
        </div>
      </Container>
    </header>
  );
}
