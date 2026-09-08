import Link from "next/link";
import { Container } from "@/components/site/Container";
import { InstagramGlyph } from "@/components/site/InstagramGlyph";
import { Logo } from "@/components/site/Logo";
import { TbcValue } from "@/components/site/TbcPill";
import { WhatsAppGlyph } from "@/components/site/WhatsAppGlyph";
import { getCertifications, getCourses, getSiteSettings } from "@/lib/content";
import { formatPhone, telHref, whatsappUrl } from "@/lib/format";
import { learnMoreNav, legalNav } from "@/lib/nav";

/** min-h-11 keeps every footer link at the 44px touch target the a11y rules set. */
const footerLinkClass =
  "inline-flex min-h-11 min-w-11 items-center text-grey-2 underline decoration-black-2 underline-offset-4 " +
  "transition-[color,background-color,border-color] duration-200 hover:text-white hover:decoration-white";

/** Black ground with the on-black lockup. The footer is the second permitted dark area. */
export async function Footer() {
  const [courses, certifications, settings] = await Promise.all([
    getCourses(),
    getCertifications(),
    getSiteSettings(),
  ]);
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-black-2 bg-black text-white">
      <Container className="py-12 md:py-20">
        {/* Two columns at 768: twelve there gave five 91px columns and wrapped every heading. */}
        <div className="grid gap-10 md:grid-cols-2 md:gap-8 lg:grid-cols-12">
          <div className="md:col-span-2 lg:col-span-3">
            <Link href="/" className="-m-2 inline-block p-2" aria-label="Espresso Academy India, home">
              <Logo on="black" alt="" className="h-20 md:h-24" />
            </Link>
            <p className="mt-5 max-w-xs type-small text-grey-2">
              {settings.partnerLine}. Coffee education since {settings.foundedFlorence},
              in Bengaluru since {settings.launchedBengaluru}.
            </p>
          </div>

          <nav aria-labelledby="footer-courses" className="lg:col-span-3">
            {/* A 12px label is not a section heading. It sat in the document outline beside the
                page's own 28/40px h2s, so a screen-reader user met four headings that look like
                peers of "What people ask first" and are not. The visible text is a label now and
                the landmark keeps a real, unstyled heading of its own. */}
            <h2 id="footer-courses" className="sr-only">
              Courses by level
            </h2>
            <p aria-hidden="true" className="type-label text-white">
              Courses by level
            </p>
            <ul className="mt-2 flex flex-col gap-1 type-small">
              {courses.map((course) => (
                <li key={course.slug}>
                  <Link href={`/courses/${course.slug}`} className={footerLinkClass}>
                    {course.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-learn" className="lg:col-span-2">
            <h2 id="footer-learn" className="sr-only">
              Learn more
            </h2>
            <p aria-hidden="true" className="type-label text-white">
              Learn more
            </p>
            <ul className="mt-2 flex flex-col gap-1 type-small">
              {learnMoreNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={footerLinkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-2">
            <h2 className="sr-only">Certifications</h2>
            <p aria-hidden="true" className="type-label text-white">
              Certifications
            </p>
            <ul className="mt-2 flex flex-col gap-1 type-small">
              {certifications.map((certification) => (
                <li key={certification.slug}>
                  <Link href={`/certifications/${certification.slug}`} className={footerLinkClass}>
                    {certification.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h2 className="sr-only">Contact</h2>
            <p aria-hidden="true" className="type-label text-white">
              Contact
            </p>
            <address className="mt-2 flex flex-col gap-1 type-small text-grey-2 not-italic">
              <span className="py-2">
                {settings.address.line1}
                <br />
                {settings.address.line2}
                <br />
                {settings.address.city} {settings.address.postalCode}
              </span>
              <a href={telHref(settings.phonePrimary)} className={footerLinkClass}>
                {formatPhone(settings.phonePrimary)}
              </a>
              {/* Optional in the schema: the academy publishes two numbers today, but a second
                  number is not something the site should invent a row for if it is ever removed. */}
              {settings.phoneSecondary ? (
                <a href={telHref(settings.phoneSecondary)} className={footerLinkClass}>
                  {formatPhone(settings.phoneSecondary)}
                </a>
              ) : null}
              <a
                href={whatsappUrl({ number: settings.whatsappNumber, template: settings.whatsappText })}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 ${footerLinkClass}`}
                data-event="whatsapp_click_footer"
              >
                <WhatsAppGlyph className="size-4" />
                WhatsApp the academy
              </a>
              {settings.instagram ? (
                <a
                  href={settings.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 ${footerLinkClass}`}
                >
                  <InstagramGlyph className="size-4" />
                  Instagram
                </a>
              ) : null}
              {/*
                `flex-wrap` and `break-all`, because the address is one 29-character token with no
                break opportunity in it. While `settings.email` was null this row held a 40px TBC
                pill and fitted anywhere; the moment revision 2 supplied the real address it pushed
                every route 127px sideways at 1024, which is the width the footer's four columns
                are tightest at.
                TODO(client): open question 6 in content/facts.md, the spelling of the address.
              */}
              <span className="flex flex-wrap items-center gap-x-2">
                Email:{" "}
                <TbcValue value={settings.email} className="break-all text-white" />
              </span>
              <span className="flex flex-wrap items-center gap-x-2">
                Hours: <TbcValue value={settings.hours} className="text-white" />
              </span>
            </address>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 hairline-on-dark pt-6 type-small text-grey-2 md:mt-16 md:flex-row md:items-center md:justify-between">
          {/* TODO(client): legal entity name. settings.legalName is null. */}
          <p>
            &copy; {year} {settings.legalName ?? settings.name}. {settings.partnerLine}.
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
