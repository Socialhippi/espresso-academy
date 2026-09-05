/** Site navigation, defined once and shared by the header, the mobile sheet and the footer. */

export interface NavItem {
  href: string;
  label: string;
  /** Used by the footer and the mobile sheet, never in the header row. */
  description?: string;
}

export const primaryNav: NavItem[] = [
  { href: "/courses", label: "Courses" },
  { href: "/calendar", label: "Calendar" },
  { href: "/certifications", label: "Certifications" },
  { href: "/trainers", label: "Trainers" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
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
