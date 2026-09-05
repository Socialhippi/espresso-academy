"use client";

// Client: two controlled fields, inline validation and a fetch to /api/enquiry.

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/site/Button";
import { WhatsAppButtonClient } from "@/components/site/WhatsAppButtonClient";
import { phoneRegex, readUtm, type EnquiryResponse } from "@/lib/enquiry";
import { cn } from "@/lib/utils";

interface WaitlistInlineProps {
  /** Course title, sent with the lead so the academy knows which batch to alert about. */
  course?: string;
  /** Batch label when the reader is asking about one specific instance. */
  batch?: string;
  /**
   * The batch's Sanity id, when the reader is waiting for one specific batch rather than for the
   * course in general. It is what puts them on that batch's roster view in the Studio, so the
   * academy can message the right list when a seat frees up.
   */
  instanceId?: string;
  className?: string;
  /** Inverts the field colours for the one black section. */
  onDark?: boolean;
}

type Status = "idle" | "sending" | "done" | "failed";

/**
 * The short form under an empty batch table: tell me when dates are announced. It posts the same
 * contract as the full enquiry form so the academy gets one lead format, not two.
 */
export function WaitlistInline({ course, batch, instanceId, className, onDark = false }: WaitlistInlineProps) {
  const nameId = useId();
  const phoneId = useId();
  const errorId = useId();
  const mountedAt = useRef<number>(0);
  const formRef = useRef<HTMLFormElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    mountedAt.current = Date.now();
    // Controlled fields: anything typed before React attaches is discarded on the first render.
    formRef.current?.setAttribute("data-hydrated", "true");
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (name.trim().length < 2) {
      setError("Enter your name");
      nameRef.current?.focus();
      return;
    }
    if (!phoneRegex.test(phone.trim())) {
      setError("Enter a 10-digit Indian mobile number, without +91");
      phoneRef.current?.focus();
      return;
    }
    setError(null);
    setStatus("sending");

    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "waitlist",
          name: name.trim(),
          phone: phone.trim(),
          course: course ?? "",
          batch: batch ?? "",
          instanceId: instanceId ?? "",
          consent: true,
          company: "",
          elapsedMs: Date.now() - mountedAt.current,
          page: window.location.pathname,
          referrer: document.referrer,
          utm: readUtm(window.location.search),
        }),
      });
      const result = (await response.json()) as EnquiryResponse;
      setStatus(result.ok ? "done" : "failed");
      if (!result.ok) {
        const first = Object.values(result.errors)[0];
        setError(first ?? "We could not send that. Use WhatsApp and we will reply there.");
      }
    } catch {
      setStatus("failed");
      setError("We could not send that. Use WhatsApp and we will reply there.");
    }
  }

  if (status === "done") {
    return (
      <div
        className={cn(
          "flex items-start gap-3 border p-4",
          onDark ? "border-black-2 text-white" : "border-white-2 text-black",
          className,
        )}
      >
        <Check className="mt-0.5 size-5 shrink-0 text-green" aria-hidden="true" />
        <p aria-live="polite" className="type-small">
          We have your number. You will hear from the academy as soon as dates are set.
        </p>
      </div>
    );
  }

  const inputClass = cn(
    "h-12 w-full rounded-xs border px-3 text-body",
    onDark
      ? "border-black-2 bg-black-2 text-white placeholder:text-grey-2"
      : "border-white-2 bg-white-3 text-black placeholder:text-grey",
  );
  const labelClass = cn("type-label", onDark ? "text-grey-2" : "text-grey");

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className={cn("flex flex-col gap-4", className)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor={nameId} className={labelClass}>
            Your name (required)
          </label>
          <input
            ref={nameRef}
            id={nameId}
            name="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={error !== null && name.trim().length < 2}
            aria-describedby={error ? errorId : undefined}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor={phoneId} className={labelClass}>
            Mobile number (required)
          </label>
          <div className="flex">
            <span
              aria-hidden="true"
              className={cn(
                "flex h-12 items-center rounded-l-xs border border-r-0 px-3 type-body",
                onDark
                  ? "border-black-2 bg-black text-grey-2"
                  : "border-white-2 bg-white-2 text-black",
              )}
            >
              +91
            </span>
            <input
              ref={phoneRef}
              id={phoneId}
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
              aria-invalid={error !== null && !phoneRegex.test(phone.trim())}
              aria-describedby={error ? errorId : undefined}
              className={cn(inputClass, "rounded-l-none")}
            />
          </div>
        </div>
      </div>

      <p id={errorId} aria-live="polite" className="min-h-0">
        {error && (
          <span
            className={cn(
              "flex items-center gap-2 type-small",
              onDark ? "text-white" : "text-red-deep",
            )}
          >
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            {error}
          </span>
        )}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          variant={onDark ? "light" : "primary"}
          size="default"
          disabled={status === "sending"}
          data-event="waitlist_submit"
        >
          {status === "sending" && (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          )}
          {status === "sending" ? "Sending" : "Tell me when dates are set"}
        </Button>
        {status === "failed" && <WhatsAppButtonClient size="sm" course={course} batch={batch} />}
      </div>

      <p className={cn("type-small", onDark ? "text-grey-2" : "text-grey")}>
        Sending this asks the academy to message you about this batch and nothing else. See the{" "}
        <Link
          href="/privacy"
          className={cn(
            "underline decoration-1 underline-offset-4",
            onDark ? "text-white" : "text-red hover:text-red-deep",
          )}
        >
          privacy note
        </Link>
        .
      </p>
    </form>
  );
}
