"use client";

// Client: it mounts a third-party widget and hands its token back through a callback.

import { useEffect, useId, useRef } from "react";

interface TurnstileProps {
  /** From NEXT_PUBLIC_TURNSTILE_SITE_KEY. Undefined renders nothing at all. */
  siteKey: string | undefined;
  onToken: (token: string | null) => void;
  className?: string;
}

interface TurnstileApi {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
      theme?: "light" | "dark" | "auto";
      size?: "normal" | "flexible" | "compact";
      appearance?: "always" | "execute" | "interaction-only";
    },
  ) => string;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    onloadTurnstileCallback?: () => void;
  }
}

const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/**
 * Cloudflare Turnstile.
 *
 * Rendered explicitly rather than by Cloudflare's auto-scan so the script is only fetched on the
 * two pages that have a form, and so the widget can be torn down cleanly when the form unmounts.
 *
 * Renders nothing without a site key, which is a supported state: the server skips verification
 * to match, and the honeypot and the two-second time floor still apply. A bot check that breaks
 * the form when a key rotates badly would be worse than no bot check.
 */
export function Turnstile({ siteKey, onToken, className }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const instanceId = useId();

  // Keep the callback fresh without making it a dependency: re-rendering the widget on every
  // parent render would reset the challenge under the reader.
  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!siteKey) return;
    let cancelled = false;

    function renderWidget(): void {
      const api = window.turnstile;
      const element = containerRef.current;
      if (cancelled || !api || !element || widgetIdRef.current) return;
      widgetIdRef.current = api.render(element, {
        sitekey: siteKey as string,
        callback: (token) => onTokenRef.current(token),
        "expired-callback": () => onTokenRef.current(null),
        "error-callback": () => onTokenRef.current(null),
        theme: "light",
        size: "flexible",
      });
    }

    const existing = document.getElementById(SCRIPT_ID);
    if (window.turnstile) {
      renderWidget();
    } else if (existing) {
      existing.addEventListener("load", renderWidget, { once: true });
    } else {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.addEventListener("load", renderWidget, { once: true });
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      const api = window.turnstile;
      const widgetId = widgetIdRef.current;
      if (api && widgetId) {
        api.remove(widgetId);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, instanceId]);

  if (!siteKey) return null;

  return <div ref={containerRef} className={className} data-testid="turnstile" />;
}
