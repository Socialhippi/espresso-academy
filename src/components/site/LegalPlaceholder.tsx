import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Container } from "@/components/site/Container";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { siteSettings } from "@/lib/content";
import { formatPhone, telHref } from "@/lib/format";

interface LegalPlaceholderProps {
  title: string;
  path: string;
  /** One-line summary under the H1. */
  intro: string;
  children: ReactNode;
}

/**
 * The shell for /privacy, /terms and /refund-policy.
 *
 * Every one of these is placeholder text written by the developer, not legal copy approved by the
 * academy, so the whole page is marked data-placeholder="true" and opens with a visible notice
 * saying so. .claude/rules/content.md allows placeholder copy only inside a marked component that
 * is listed in docs/STATUS.md; all three are listed there under "needs client".
 */
export function LegalPlaceholder({ title, path, intro, children }: LegalPlaceholderProps) {
  return (
    <Container className="py-10 md:py-16" data-placeholder="true">
      <Breadcrumbs items={[{ label: title, href: path }]} />

      <h1 className="mt-6 type-h1 text-black md:mt-8">{title}</h1>
      <p className="mt-5 measure type-body text-grey">{intro}</p>

      {/* TODO(client): this page is a plain-English placeholder. It has not been reviewed by a
          lawyer and it is not the academy's approved wording. Replace before launch. */}
      <div className="mt-8 flex gap-4 border border-red bg-white p-5 measure">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red" aria-hidden="true" />
        <div>
          <p className="type-body font-medium text-black">This page is a placeholder</p>
          <p className="mt-2 type-small text-grey">
            It is written in plain English so the site is not launched with an empty page, but it
            has not been reviewed by a lawyer and it is not the academy&rsquo;s approved wording.
            The academy is preparing the real text. Until it lands, ask us anything you need to
            know and you will get a direct answer.
          </p>
          <WhatsAppButton
            className="mt-4"
            size="sm"
            message="Hi, I have a question about your terms."
            event="whatsapp_click_legal"
          >
            Ask the academy
          </WhatsAppButton>
        </div>
      </div>

      <div className="mt-12 measure">{children}</div>

      <div className="mt-12 hairline pt-6 type-small text-grey">
        <p>
          Questions about this page go to the academy at{" "}
          <a
            href={telHref(siteSettings.phonePrimary)}
            className="text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
          >
            {formatPhone(siteSettings.phonePrimary)}
          </a>
          , or in person at {siteSettings.address.line1}, {siteSettings.address.line2},{" "}
          {siteSettings.address.city} {siteSettings.address.postalCode}.
        </p>
        <p className="mt-3">
          See also{" "}
          <Link
            href="/privacy"
            className="text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
          >
            privacy
          </Link>
          ,{" "}
          <Link
            href="/terms"
            className="text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
          >
            terms
          </Link>{" "}
          and the{" "}
          <Link
            href="/refund-policy"
            className="text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
          >
            refund policy
          </Link>
          .
        </p>
      </div>
    </Container>
  );
}

interface LegalSectionProps {
  title: string;
  children: ReactNode;
}

export function LegalSection({ title, children }: LegalSectionProps) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="type-h3 text-black">{title}</h2>
      <div className="mt-3 flex flex-col gap-3 type-body text-grey">{children}</div>
    </section>
  );
}
