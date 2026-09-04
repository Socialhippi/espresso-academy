import Link from "next/link";
import { Container } from "@/components/site/Container";
import { InstagramGlyph } from "@/components/site/InstagramGlyph";
import { Logo } from "@/components/site/Logo";
import { TbcValue } from "@/components/site/TbcPill";
import { WhatsAppGlyph } from "@/components/site/WhatsAppGlyph";
import { getCertifications, getCourses, siteSettings } from "@/lib/content";
import { formatPhone, telHref, whatsappUrl } from "@/lib/format";
import { learnMoreNav, legalNav } from "@/lib/nav";

/** min-h-11 keeps every footer link at the 44px touch target the a11y rules set. */
const footerLinkClass =
  "inline-flex min-h-11 min-w-11 items-center text-grey-2 underline decoration-black-2 underline-offset-4 " +
  "transition-[color,background-color,border-color] duration-200 hover:text-white hover:decoration-white";

/** Black ground with the on-black lockup. The footer is the second permitted dark area. */
export function Footer() {
  const courses = getCourses();
  const certifications = getCertifications();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-black text-white">
      <Container className="py-12 md:py-20">
        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-3">
            <Link href="/" className="-m-2 inline-block p-2" aria-label="Espresso Academy India, home">
              <Logo on="black" alt="" className="h-20 md:h-24" />
            </Link>
            <p className="mt-5 max-w-xs type-small text-grey-2">
              {siteSettings.partnerLine}. Coffee education since {siteSettings.foundedFlorence},
              in Bengaluru since {siteSettings.launchedBengaluru}.
            </p>
          </div>

          <nav aria-labelledby="footer-courses" className="md:col-span-3">
            <h2 id="footer-courses" className="type-label text-white">
              Courses by level
            </h2>
            <ul className="mt-2 flex flex-col type-small">
              {courses.map((course) => (
                <li key={course.slug}>
                  <Link href={`/courses/${course.slug}`} className={footerLinkClass}>
                    {course.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-learn" className="md:col-span-2">
            <h2 id="footer-learn" className="type-label text-white">
              Learn more
            </h2>
            <ul className="mt-2 flex flex-col type-small">
              {learnMoreNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={footerLinkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-2">
            <h2 className="type-label text-white">Certifications</h2>
            <ul className="mt-2 flex flex-col type-small">
              {certifications.map((certification) => (
                <li key={certification.slug}>
                  <Link href={`/certifications/${certification.slug}`} className={footerLinkClass}>
                    {certification.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h2 className="type-label text-white">Contact</h2>
            <address className="mt-2 flex flex-col gap-1 type-small text-grey-2 not-italic">
              <span className="py-2">
                {siteSettings.address.line1}
                <br />
                {siteSettings.address.line2}
                <br />
                {siteSettings.address.city} {siteSettings.address.postalCode}
              </span>
              <a href={telHref(siteSettings.phonePrimary)} className={footerLinkClass}>
                {formatPhone(siteSettings.phonePrimary)}
              </a>
              <a href={telHref(siteSettings.phoneSecondary)} className={footerLinkClass}>
                {formatPhone(siteSettings.phoneSecondary)}
              </a>
              <a
                href={whatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 ${footerLinkClass}`}
                data-event="whatsapp_click_footer"
              >
                <WhatsAppGlyph className="size-4" />
                WhatsApp the academy
              </a>
              <a
                href={siteSettings.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 ${footerLinkClass}`}
              >
                <InstagramGlyph className="size-4" />
                Instagram
              </a>
              {/* TODO(client): public email address and opening hours are not published yet. */}
              <span className="flex items-center gap-2">
                Email: <TbcValue value={siteSettings.email} className="text-white" />
              </span>
              <span className="flex items-center gap-2">
                Hours: <TbcValue value={siteSettings.hours} className="text-white" />
              </span>
            </address>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 hairline-on-dark pt-6 type-small text-grey-2 md:mt-16 md:flex-row md:items-center md:justify-between">
          {/* TODO(client): legal entity name. siteSettings.legalName is null. */}
          <p>
            &copy; {year} {siteSettings.legalName ?? siteSettings.name}. {siteSettings.partnerLine}.
          </p>
          <ul className="flex flex-wrap gap-x-6">
            {legalNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={footerLinkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}
