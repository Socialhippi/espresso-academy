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
  { href: "/certifications", label: "Certifications" },
  { href: "/trainers", label: "Trainers" },
  { href: "/about", label: "About the academy" },
  { href: "/calendar", label: "Batch calendar" },
  { href: "/faq", label: "Questions and answers" },
  { href: "/contact", label: "Visit the campus" },
];

export const legalNav: NavItem[] = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/refund-policy", label: "Refund policy" },
];

/** Routes where the mobile sticky bar would compete with the page's own single action. */
export const routesWithoutStickyBar: string[] = ["/enquire", "/thank-you"];

export function shouldShowStickyBar(pathname: string): boolean {
  return !routesWithoutStickyBar.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
