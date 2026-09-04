"use client";

// Client: the store is a browser cookie.

import { useSyncExternalStore } from "react";

const COOKIE_NAME = "ea-consent";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export type Consent = "accepted" | "declined" | null;

/**
 * The consent cookie, read through useSyncExternalStore rather than an effect so there is no
 * setState-in-effect cascade and no flash.
 *
 * Two components need it: the banner, to know whether to render, and the sticky bar, to stay out
 * of the way while the banner is up. Both are fixed to the bottom of the viewport on mobile, and
 * without this the banner sits on top of the WhatsApp, Call and Reserve buttons, which are the
 * site's primary conversion path for two thirds of its audience.
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

/** On the server, treat the choice as already made: the banner is never in the static HTML. */
function getServerSnapshot(): Consent {
  return "accepted";
}

export function useConsent(): Consent {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function writeConsent(value: Exclude<Consent, null>): void {
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
  for (const listener of listeners) listener();
}
