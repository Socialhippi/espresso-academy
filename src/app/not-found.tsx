import type { Metadata } from "next";
import { Container } from "@/components/site/Container";
import { ButtonLink } from "@/components/site/Button";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { primaryNav } from "@/lib/nav";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <Container className="py-16 md:py-28">
      <p className="eyebrow">
        <span className="type-numeral text-h3-lg leading-none" aria-hidden="true">
          404
        </span>
        Not found
      </p>
      <h1 className="mt-4 type-h1 text-black">That page is not here</h1>
      <p className="mt-5 measure type-body text-grey">
        The link may be old, or we may have moved the page. The courses are the best place to
        pick the thread back up. If you were looking for something specific, ask on WhatsApp and
        we will send you straight to it.
      </p>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
        <ButtonLink href="/courses" variant="primary">
          See all courses
        </ButtonLink>
        <WhatsAppButton event="whatsapp_click_404" />
      </div>

      <nav aria-label="Site sections" className="mt-14 hairline pt-6">
        <h2 className="type-label text-grey">Everything on the site</h2>
        <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
          {primaryNav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="type-body text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </Container>
  );
}
