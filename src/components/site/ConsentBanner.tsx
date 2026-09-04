"use client";

// Client: reads and writes the consent cookie and dismisses itself on choice.

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Button } from "@/components/site/Button";
import { Container } from "@/components/site/Container";

const COOKIE_NAME = "ea-consent";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

type Consent = "accepted" | "declined" | null;

/**
 * The cookie is the store. Reading it through useSyncExternalStore rather than an effect means no
 * setState-in-effect cascade, and the server snapshot says "already decided" so the banner is
 * absent from the static HTML and cannot shift the first paint.
 */
let listeners: (() => void)[] = [];

function subscribe(onChange: () => void): () => void {
  listeners = [...listeners, onChange];
  return () => {
    listeners = listeners.filter((listener) => listener !== onChange);
  };
}

function getSnapshot(): Consent {
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  const value = match?.[1] ? decodeURIComponent(match[1]) : null;
  return value === "accepted" || value === "declined" ? value : null;
}

function getServerSnapshot(): Consent {
  return "accepted";
}

function writeConsent(value: Exclude<Consent, null>): void {
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
  for (const listener of listeners) listener();
}

/**
 * Measurement consent. No analytics or marketing script is loaded on this site yet, so nothing is
 * actually gated: the banner records the choice now so GTM and GA4 can read it in a later phase.
 *
 * The copy is kept short on purpose. The banner paints at hydration, and a fixed full-width block
 * of body text is easily the largest thing in the viewport at that moment, which made it the
 * Largest Contentful Paint on course pages at 2.4s even though the H1 had painted at 0.7s.
 */
export function ConsentBanner() {
  const consent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (consent !== null) return null;

  const choose = (value: Exclude<Consent, null>) => () => writeConsent(value);

  return (
    <div
      role="region"
      aria-label="Cookie choices"
      className="fixed inset-x-0 bottom-24 z-60 md:bottom-0"
    >
      <Container>
        <div className="rounded-sm border border-white-2 bg-white p-5 shadow-sm md:mb-6 md:flex md:items-center md:justify-between md:gap-8">
          {/* Deliberately short. See the note above the component. */}
          <p className="measure-tight type-small text-grey">
            One cookie remembers this choice. Nothing else is measured yet.{" "}
            <Link
              href="/privacy"
              className="text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
            >
              Privacy
            </Link>
          </p>
          <div className="mt-4 flex gap-3 md:mt-0 md:shrink-0">
            <Button variant="secondary" size="sm" onClick={choose("declined")}>
              No thanks
            </Button>
            <Button variant="primary" size="sm" onClick={choose("accepted")}>
              That is fine
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}
