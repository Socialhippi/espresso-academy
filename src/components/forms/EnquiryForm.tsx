"use client";

// Client: controlled fields, blur validation, focus management and a fetch to /api/enquiry.

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { Button, ButtonLink } from "@/components/site/Button";
import { WhatsAppButtonClient } from "@/components/site/WhatsAppButtonClient";
import { Field, FieldError, fieldControlClass, fieldInputClass } from "@/components/forms/Field";
import { Turnstile } from "@/components/forms/Turnstile";
import {
  MIN_TIME_ON_FORM_MS,
  phoneRegex,
  readUtm,
  type EnquiryResponse,
  type EnquiryType,
} from "@/lib/enquiry";
import { whatsappUrl } from "@/lib/format";
import { useSiteConfig } from "@/lib/site-config";
import { eventId, track } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

/** The minimum a course needs to appear in the picker. Passed from the server. */
export interface CourseOption {
  slug: string;
  title: string;
  /** Batch labels for this course. Empty while no instance carries a date. */
  /* The document id is the value and the date is the label. A batch has to travel as its id: the
     enquiry schema carries `instanceId` separately from the human `batch` label, and only the id
     puts the person on that batch's roster in the Studio. Passing the date meant a waitlist
     enquiry stored a string nobody could join to a batch. */
  batches: { id: string; label: string }[];
}

interface EnquiryFormProps {
  variant?: EnquiryType;
  courses: CourseOption[];
  /** Trust line under the submit, e.g. siteSettings.replyPromise. */
  replyPromise?: string | null;
  /**
   * Course slug and batch id from the page's query string, read on the server. Deliberately
   * not `useSearchParams`: that needs a Suspense boundary, which on a static page renders a
   * fallback and then swaps the whole form in, shifting the page under the reader.
   */
  defaultCourse?: string;
  defaultBatch?: string;
  /** From NEXT_PUBLIC_TURNSTILE_SITE_KEY. Undefined renders no widget, and the server skips the check. */
  turnstileSiteKey?: string;
  className?: string;
}

type FieldName = "name" | "phone" | "email" | "course" | "batch" | "message" | "consent";
type Errors = Partial<Record<FieldName | "form", string>>;

const heading: Record<EnquiryType, string> = {
  student: "Ask about a course",
  waitlist: "Get the batch alert",
  cafe: "Train your cafe team",
};

const submitLabel: Record<EnquiryType, string> = {
  student: "Send my enquiry",
  waitlist: "Tell me when dates are set",
  cafe: "Send my enquiry",
};

export function EnquiryForm({
  variant = "student",
  courses,
  replyPromise,
  defaultCourse = "",
  defaultBatch = "",
  turnstileSiteKey,
  className,
}: EnquiryFormProps) {
  const config = useSiteConfig();
  const ids = useId();
  const field = (name: string): string => `${ids}-${name}`;

  const mountedAt = useRef<number>(0);
  const formRef = useRef<HTMLFormElement>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [course, setCourse] = useState(defaultCourse);
  const [batch, setBatch] = useState(defaultBatch);
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [company, setCompany] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  /* Fired once, on the first real interaction. A form_start per keystroke would drown the funnel. */
  const startedRef = useRef(false);

  const onFirstInteraction = (): void => {
    if (startedRef.current) return;
    startedRef.current = true;
    track("form_start", { form_id: `enquiry_${variant}` });
  };
  const onTurnstileToken = useCallback((token: string | null) => setTurnstileToken(token), []);

  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const [delivery, setDelivery] = useState<"email" | "whatsapp">("whatsapp");

  useEffect(() => {
    mountedAt.current = Date.now();
    // The fields are controlled, so anything typed before this point is discarded on the first
    // React render. The attribute marks the form as genuinely interactive.
    formRef.current?.setAttribute("data-hydrated", "true");
  }, []);

  const selected = useMemo(
    () => courses.find((option) => option.slug === course),
    [courses, course],
  );
  const courseTitle = selected?.title ?? null;
  /* The slug, not the title. The route resolves it to a course reference in Sanity, and it is also
     what the WhatsApp handoff and the course link in the auto-reply are built from. */
  const courseSlugForRequest = selected?.slug ?? course;

  function validate(only?: FieldName): Errors {
    const next: Errors = {};
    if (!only || only === "name") {
      if (name.trim().length < 2) next.name = "Enter your name";
    }
    if (!only || only === "phone") {
      if (!phoneRegex.test(phone.trim())) {
        next.phone = "Enter a 10-digit Indian mobile number, without +91";
      }
    }
    if (!only || only === "email") {
      /* Optional, so an empty field is fine; a filled one has to be plausible, because the
         auto-reply and the fee sheet both go to it and a typo means silence. */
      if (email.trim() !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
        next.email = "Enter a valid email address, or leave it empty";
      }
    }
    if (!only || only === "consent") {
      if (!consent) next.consent = "Tick the box so we can reply to you";
    }
    return next;
  }

  function onBlur(name: FieldName) {
    return () => {
      const found = validate(name);
      setErrors((current) => ({ ...current, [name]: found[name] }));
    };
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const found = validate();
    setErrors(found);

    const order: FieldName[] = ["name", "phone", "email", "consent"];
    const firstBad = order.find((key) => found[key]);
    if (firstBad) {
      track("form_error", { form_id: `enquiry_${variant}`, reason: firstBad });
      const element = formRef.current?.querySelector<HTMLElement>(
        `#${CSS.escape(field(firstBad))}`,
      );
      element?.focus();
      return;
    }

    setStatus("sending");
    track("form_submit", { form_id: `enquiry_${variant}`, course_id: courseSlugForRequest || undefined });

    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: variant,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          course: courseSlugForRequest,
          /* Both halves: the id makes the reference, the label is what a person reads in the
             academy's email and in the lead sheet. */
          instanceId: batch,
          batch: selected?.batches.find((option) => option.id === batch)?.label ?? "",
          message: message.trim(),
          consent: true,
          company,
          elapsedMs: Date.now() - mountedAt.current,
          turnstileToken: turnstileToken ?? undefined,
          page: window.location.pathname,
          referrer: document.referrer,
          utm: readUtm(window.location.search),
        }),
      });
      const result = (await response.json()) as EnquiryResponse;
      if (result.ok) {
        setDelivery(result.delivery);
        setStatus("done");
        /*
         * `generate_lead` and `waitlist_join` are different funnels: one is somebody asking about a
         * course, the other is somebody asking to be told when a date exists. Reporting both as a
         * lead would make the waitlist look like demand it is not.
         *
         * The event_id pairs with the server-side Meta CAPI Lead so the two are counted once. It is
         * derived from the phone number rather than being random, because the server derives its
         * own from the enquiry id and the two only have to agree per submission, not per byte.
         */
        if (variant === "waitlist") {
          track("waitlist_join", { course_id: courseSlugForRequest || undefined });
        } else {
          track("generate_lead", {
            form_id: `enquiry_${variant}`,
            course_id: courseSlugForRequest || undefined,
            currency: "INR",
            event_id: eventId("lead", phone.trim()),
          });
        }
      } else {
        setErrors({ ...result.errors, form: result.errors.form });
        setStatus("failed");
        track("form_error", { form_id: `enquiry_${variant}`, reason: "rejected" });
      }
    } catch {
      setStatus("failed");
      setErrors({ form: "We could not send that just now." });
    }
  }

  if (status === "done") {
    return (
      <div className={cn("border border-white-2 bg-white-3 p-6 md:p-8", className)}>
        <p className="flex items-center gap-3 type-h3 text-black">
          <Check className="size-6 shrink-0 text-green" aria-hidden="true" />
          We have your enquiry
        </p>
        <p aria-live="polite" className="mt-4 measure type-body text-grey">
          {delivery === "email"
            ? "It is with the academy now. Someone will reply on WhatsApp or call the number you gave us."
            : "It is logged. The fastest reply is on WhatsApp, so carry it over and the academy will answer there."}
        </p>
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
          <WhatsAppButtonClient
            course={courseTitle}
            batch={selected?.batches.find((option) => option.id === batch)?.label || undefined}
            event="whatsapp_click_success"
          >
            Continue on WhatsApp
          </WhatsAppButtonClient>
          {variant === "cafe" ? (
            /* A cafe enquiry wants a conversation, not a course list. /thank-you?topic=cafe offers
               a call slot when Cal.com is configured and says the academy will ring otherwise. */
            <ButtonLink href="/thank-you?topic=cafe" variant="secondary">
              Put a call in the diary
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/courses" variant="secondary">
                Back to the courses
              </ButtonLink>
              <ButtonLink href="/calendar" variant="tertiary" size="inline">
                See the batch calendar
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    );
  }

  const showBatch = (selected?.batches.length ?? 0) > 0;

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      onFocusCapture={onFirstInteraction}
      noValidate
      className={cn("flex flex-col gap-6", className)}
      aria-labelledby={field("heading")}
    >
      <h2 id={field("heading")} className="sr-only">
        {heading[variant]}
      </h2>

      <Field
        id={field("name")}
        label="Your name"
        required
        error={errors.name}
        errorId={field("name-error")}
      >
        <input
          id={field("name")}
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={onBlur("name")}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? field("name-error") : undefined}
          className={fieldInputClass}
        />
      </Field>

      <Field
        id={field("phone")}
        label="Mobile number"
        required
        hint="We reply on WhatsApp, so use the number WhatsApp is on."
        hintId={field("phone-hint")}
        error={errors.phone}
        errorId={field("phone-error")}
      >
        <div className="flex">
          <span
            aria-hidden="true"
            className="flex h-12 items-center rounded-l-xs border border-r-0 border-white-2 bg-white-2 px-3 type-body text-black"
          >
            +91
          </span>
          <input
            id={field("phone")}
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            value={phone}
            onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
            onBlur={onBlur("phone")}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={cn(
              field("phone-hint"),
              errors.phone ? field("phone-error") : "",
            ).trim()}
            className={cn(fieldInputClass, "rounded-l-none")}
          />
        </div>
      </Field>

      <Field
        id={field("email")}
        label="Email"
        hint="Optional. Where a fee sheet or a joining email would go."
        hintId={field("email-hint")}
        error={errors.email}
        errorId={field("email-error")}
      >
        <input
          id={field("email")}
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onBlur={onBlur("email")}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={cn(field("email-hint"), errors.email ? field("email-error") : "").trim()}
          className={fieldInputClass}
        />
      </Field>

      {variant !== "cafe" && (
        <Field id={field("course")} label="Which course" error={errors.course}>
          <select
            id={field("course")}
            name="course"
            value={course}
            onChange={(event) => {
              setCourse(event.target.value);
              setBatch("");
            }}
            className={cn(fieldControlClass, "h-12")}
          >
            <option value="">I am not sure yet, help me choose</option>
            {courses.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.title}
              </option>
            ))}
          </select>
        </Field>
      )}

      {variant !== "cafe" &&
        (showBatch ? (
          <Field id={field("batch")} label="Which batch">
            <select
              id={field("batch")}
              name="batch"
              value={batch}
              onChange={(event) => setBatch(event.target.value)}
              className={cn(fieldControlClass, "h-12")}
            >
              <option value="">Any batch, tell me what is next</option>
              {selected?.batches.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          /* TODO(client): batch dates. No instance in content/data.ts carries a start date. */
          <p className="type-small text-grey">
            Batch dates are being finalised. Send this and the academy will tell you the next one
            first.
          </p>
        ))}

      <Field
        id={field("message")}
        label={
          variant === "cafe"
            ? "Your cafe, team size and what you want them to be able to do"
            : "Anything we should know"
        }
        error={errors.message}
      >
        <textarea
          id={field("message")}
          name="message"
          rows={4}
          maxLength={1000}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className={cn(fieldControlClass, "py-3")}
        />
      </Field>

      <Turnstile
        siteKey={turnstileSiteKey}
        onToken={onTurnstileToken}
        className="min-h-[65px]"
      />

      {/* Honeypot. Hidden from sight and from assistive tech; only a bot fills it. */}
      <div aria-hidden="true" className="sr-only">
        <label htmlFor={field("company")}>Company</label>
        <input
          id={field("company")}
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        {/* The box is 24px, the WCAG 2.2 AA minimum for a target. The real hit area is the row:
            the label beside it is associated by htmlFor, so tapping the sentence toggles the box.
            Padding the input itself does nothing, because padding around an input is not clickable. */}
        <div className="flex min-h-11 items-start gap-3">
          <input
            id={field("consent")}
            name="consent"
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            onBlur={onBlur("consent")}
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent ? field("consent-error") : undefined}
            // size-6 is the 24px WCAG 2.2 target minimum; the associated label extends the hit area.
            /* 24px box, 44px target. `box-content` with 10px of padding grows the hit area to
               44x44 without changing what is drawn, and the negative margin keeps the text aligned
               to the box rather than to the padding. WCAG 2.5.8 asks for 24; this project asks for
               44, and a checkbox is the control most often missed on a phone. */
            className="-m-2.5 -mt-2 box-content size-6 shrink-0 rounded-xs border border-white-2 p-2.5 accent-red"
          />
          <label htmlFor={field("consent")} className="type-small text-grey">
            The academy may contact me about this enquiry on WhatsApp, phone or email (required).
            See the{" "}
            <Link
              href="/privacy"
              className="text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
            >
              privacy note
            </Link>
            .
          </label>
        </div>
        <FieldError id={field("consent-error")} message={errors.consent} />
      </div>

      {status === "failed" && (
        <div role="alert" className="border border-red-deep bg-white p-4">
          <p className="type-body text-red-deep">
            {errors.form ?? "We could not send that just now."}
          </p>
          <p className="mt-2 type-small text-grey">
            Nothing is lost. Send the same message on WhatsApp and the academy will answer there.
          </p>
          <WhatsAppButtonClient
            className="mt-4"
            size="sm"
            course={courseTitle}
            batch={selected?.batches.find((option) => option.id === batch)?.label || undefined}
            event="whatsapp_click_form_fallback"
          />
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Button
          type="submit"
          variant="primary"
          size="block"
          disabled={status === "sending"}
          data-event={`enquiry_submit_${variant}`}
          className="sm:w-auto"
        >
          {status === "sending" && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
          {status === "sending" ? "Sending" : submitLabel[variant]}
        </Button>
        <p className="type-small text-grey">
          {/* TODO(client): siteSettings.replyPromise. Reply time is not confirmed. */}
          {replyPromise ?? "We reply on WhatsApp during academy hours."}
        </p>
        <noscript>
          <p className="type-small text-grey">
            This form needs JavaScript. Message the academy on{" "}
            <a
              href={whatsappUrl({ number: config.whatsappNumber, template: config.whatsappText })}
              className="text-red underline decoration-1 underline-offset-4"
            >
              WhatsApp
            </a>{" "}
            instead and you will get the same reply.
          </p>
        </noscript>
      </div>

      <p className="sr-only" aria-live="polite">
        {status === "sending" ? "Sending your enquiry" : ""}
      </p>
      <input type="hidden" name="minTime" value={MIN_TIME_ON_FORM_MS} readOnly />
    </form>
  );
}
