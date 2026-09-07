/** Site navigation, defined once and shared by the header, the mobile sheet and the footer. */

export interface NavItem {
  href: string;
  label: string;
  /** Used by the footer and the mobile sheet, never in the header row. */
  description?: string;
}

/**
 * Seven items, and the seventh is Contact.
 *
 * A coffee school in Bengaluru is a place people come to. Somebody who wants the address, the
 * hours or the map had to find Contact in the footer, which on a phone is the whole page away.
 *
 * FAQ moved out to make room. It is the one item here that answers a question the reader could
 * also get from the page they are already on — every course page carries its own FAQ block, and
 * /faq is linked from the home page's questions section and from the footer. Contact is not
 * reachable any other way. The header measures 1064px with six items inside design.md's 32px
 * gutters and the nav breakpoint is 1080, so seven items of this width still fit; the mobile
 * sheet lists all of them plus the wider `learnMoreNav`.
 */
export const primaryNav: NavItem[] = [
  { href: "/courses", label: "Courses" },
  { href: "/calendar", label: "Calendar" },
  { href: "/certifications", label: "Certifications" },
  { href: "/trainers", label: "Trainers" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export const learnMoreNav: NavItem[] = [
  { href: "/guides", label: "Guides and answers" },
  { href: "/workshops", label: "Short workshops" },
  { href: "/certifications", label: "Certifications" },
  { href: "/trainers", label: "Trainers" },
  { href: "/about", label: "About the academy" },
  { href: "/calendar", label: "Batch calendar" },
  { href: "/faq", label: "Questions and answers" },
  { href: "/student-stories", label: "Student stories" },
  { href: "/for-cafes", label: "For cafes and teams" },
  { href: "/contact", label: "Visit the campus" },
];

export const legalNav: NavItem[] = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/refund-policy", label: "Refund policy" },
];

/**
 * The sticky bar's third button, per route.
 *
 * The bar carries WhatsApp, Call and one contextual action, and that action used to fall through
 * to "Courses" on every page that is not a course — including /for-cafes, whose entire job is a
 * cafe proposal, and /workshops, whose job is the batch alert. The most prominent persistent
 * control on a 64%-mobile site was sending those readers to the student course hub.
 *
 * A route declares its own primary here. Course pages are deliberately absent: their action
 * depends on whether a batch can be paid for, which the bar already works out from `courseBar`.
 * Anything not listed keeps the Courses default, which is the safest destination when a page has
 * no single obvious next step.
 */
export interface StickyPrimary {
  label: string;
  href: string;
  /** Analytics name, so the bar's button reports what it did rather than where it sat. */
  event: string;
  /** Appended for screen readers, because two-word labels lose their object out of context. */
  srSuffix?: string;
}

const stickyPrimaryByRoute: Record<string, StickyPrimary> = {
  "/for-cafes": {
    label: "Request a proposal",
    href: "/for-cafes#enquire",
    event: "cafe_proposal_click_sticky",
  },
  "/workshops": {
    label: "Get the alert",
    href: "/workshops#batch-alert",
    event: "waitlist_click_sticky",
    srSuffix: " when a workshop is scheduled",
  },
};

export function stickyPrimaryFor(pathname: string): StickyPrimary | undefined {
  return stickyPrimaryByRoute[pathname];
}

/** Routes where the mobile sticky bar would compete with the page's own single action. */
export const routesWithoutStickyBar: string[] = ["/enquire", "/thank-you"];

/**
 * Routes that replace the site chrome with their own.
 *
 * A campaign landing page carries a logo and a phone number and nothing else: every other link is
 * a way to leave without converting. It supplies its own header, so the site's must not also
 * render, or the page would have two `<header>` landmarks and a screen reader would meet the
 * navigation twice.
 */
export const routesWithoutSiteChrome: string[] = ["/lp"];

function matches(pathname: string, routes: string[]): boolean {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function shouldShowStickyBar(pathname: string): boolean {
  return !matches(pathname, routesWithoutStickyBar) && !matches(pathname, routesWithoutSiteChrome);
}

export function shouldShowSiteChrome(pathname: string): boolean {
  return !matches(pathname, routesWithoutSiteChrome);
}
