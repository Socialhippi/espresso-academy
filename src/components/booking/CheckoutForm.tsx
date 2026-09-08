"use client";

// Client: controlled fields, blur validation, and it opens the Razorpay window.

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/site/Button";
import { WhatsAppButtonClient } from "@/components/site/WhatsAppButtonClient";
import { Field, FieldError, fieldInputClass } from "@/components/forms/Field";
import { Turnstile } from "@/components/forms/Turnstile";
import { phoneRegex, readUtm } from "@/lib/enquiry";
import { track } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

/** What the server needs to be told, and nothing else. There is no amount field on purpose. */
export interface CheckoutFormProps {
  instanceId: string;
  courseSlug: string;
  courseTitle: string;
  /**
   * For display only, all of it. The server recomputes the charge from the fee it reads out of
   * Sanity and ignores anything the browser says about money (CLAUDE.md rule 11). These are here
   * so the button can name the figure the student is about to be charged.
   */
  amount: number;
  balance: number;
  paymentType: "advance" | "full";
  /** Whether `amount` and `balance` include GST. Decides the suffix, nothing else. */
  gstIncluded: boolean;
  /** Present when the course states one; the confirmation checkbox is then required. */
  prerequisite: string | null;
  turnstileSiteKey: string | undefined;
  className?: string;
}

interface OrderResponseBody {
  ok: boolean;
  order?: {
    bookingId: string;
    orderId: string;
    amountInPaise: number;
    currency: string;
    keyId: string;
    name: string;
    description: string;
    prefill: { name: string; email: string; contact: string };
  };
  errors?: Record<string, string>;
  soldOut?: boolean;
}

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  notes?: Record<string, string>;
  theme?: { color: string };
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (payload: unknown) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

const CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

type FieldName = "name" | "phone" | "email" | "prerequisiteAccepted" | "consent";
type Errors = Partial<Record<FieldName | "form", string>>;

export function CheckoutForm({
  instanceId,
  courseSlug,
  courseTitle,
  amount,
  balance,
  paymentType,
  gstIncluded,
  prerequisite,
  turnstileSiteKey,
  className,
}: CheckoutFormProps) {
  const router = useRouter();
  const id = useId();
  const field = (name: string) => `${id}-${name}`;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [prerequisiteAccepted, setPrerequisiteAccepted] = useState(false);
  const [consent, setConsent] = useState(false);
  const [company, setCompany] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const startedRef = useRef(false);

  const onFirstInteraction = (): void => {
    if (startedRef.current) return;
    startedRef.current = true;
    track("form_start", { form_id: "checkout", course_id: courseSlug, instance_id: instanceId });
  };

  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "creating" | "paying" | "verifying">("idle");
  const [soldOut, setSoldOut] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  /* 0 until the mount effect sets it, so the render stays pure; the effect is also where the real
     clock should start, because that is when the form became typeable. */
  const mountedAt = useRef<number>(0);

  useEffect(() => {
    mountedAt.current = Date.now();
    // The tests wait for this rather than for a timeout: a controlled field discards anything
    // typed before React hydrates, which no human can outrun but a script can.
    formRef.current?.setAttribute("data-hydrated", "true");
  }, []);

  useEffect(() => {
    // Viewing a checkout page IS viewing that batch, so batch_view is fired here rather than from
    // a separate observer on a table row that may never be scrolled to.
    track("batch_view", { instance_id: instanceId, course_id: courseSlug });
    track("begin_checkout", {
      instance_id: instanceId,
      course_id: courseSlug,
      value: amount,
      currency: "INR",
    });
  }, [instanceId, courseSlug, amount]);

  const onToken = useCallback((token: string | null) => setTurnstileToken(token), []);

  function validate(only?: FieldName): Errors {
    const next: Errors = {};
    if (!only || only === "name") {
      if (name.trim().length < 2) next.name = "Enter your name";
    }
    if (!only || only === "phone") {
      if (!phoneRegex.test(phone)) next.phone = "Enter a 10-digit Indian mobile number";
    }
    if (!only || only === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
        next.email = "Enter an email address we can send the confirmation to";
      }
    }
    if (prerequisite && (!only || only === "prerequisiteAccepted")) {
      if (!prerequisiteAccepted) next.prerequisiteAccepted = "Confirm that you meet the prerequisite";
    }
    if (!only || only === "consent") {
      if (!consent) next.consent = "Tick the box so we can contact you about this booking";
    }
    return next;
  }

  const onBlur = (which: FieldName) => () => {
    const found = validate(which)[which];
    setErrors((current) => ({ ...current, [which]: found }));
  };

  function focusFirstError(found: Errors): void {
    const order: FieldName[] = ["name", "phone", "email", "prerequisiteAccepted", "consent"];
    for (const key of order) {
      if (found[key]) {
        document.getElementById(field(key))?.focus();
        return;
      }
    }
  }

  async function loadCheckoutScript(): Promise<boolean> {
    if (window.Razorpay) return true;
    return new Promise((resolve) => {
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${CHECKOUT_SCRIPT}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve(Boolean(window.Razorpay)), { once: true });
        existing.addEventListener("error", () => resolve(false), { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = CHECKOUT_SCRIPT;
      script.async = true;
      script.addEventListener("load", () => resolve(Boolean(window.Razorpay)), { once: true });
      script.addEventListener("error", () => resolve(false), { once: true });
      document.head.appendChild(script);
    });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (status !== "idle") return;

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      track("form_error", { form_id: "checkout", course_id: courseSlug, reason: Object.keys(found)[0] });
      focusFirstError(found);
      return;
    }

    setStatus("creating");
    track("add_payment_info", { instance_id: instanceId, course_id: courseSlug, value: amount });

    let body: OrderResponseBody;
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          instanceId,
          name: name.trim(),
          phone,
          email: email.trim(),
          prerequisiteAccepted: prerequisite ? prerequisiteAccepted : undefined,
          consent: true,
          company,
          elapsedMs: Date.now() - mountedAt.current,
          turnstileToken: turnstileToken ?? undefined,
          page: window.location.pathname,
          referrer: document.referrer,
          utm: readUtm(window.location.search),
        }),
      });
      body = (await response.json()) as OrderResponseBody;
    } catch {
      setStatus("idle");
      setErrors({ form: "We could not reach the payment service. Try again, or message us on WhatsApp." });
      track("booking_failed", { course_id: courseSlug, reason: "network" });
      return;
    }

    if (!body.ok || !body.order) {
      setStatus("idle");
      if (body.soldOut) setSoldOut(true);
      setErrors(body.errors ?? { form: "We could not start that booking." });
      track("booking_failed", { course_id: courseSlug, reason: body.soldOut ? "sold_out" : "rejected" });
      return;
    }

    const order = body.order;
    const scriptReady = await loadCheckoutScript();
    if (!scriptReady || !window.Razorpay) {
      setStatus("idle");
      setErrors({ form: "The payment window did not load. Check your connection, or message us on WhatsApp." });
      track("booking_failed", { course_id: courseSlug, reason: "checkout_script" });
      return;
    }

    setStatus("paying");

    const checkout = new window.Razorpay({
      key: order.keyId,
      amount: order.amountInPaise,
      currency: order.currency,
      name: order.name,
      description: order.description,
      order_id: order.orderId,
      prefill: order.prefill,
      notes: { bookingId: order.bookingId, courseSlug },
      // The brand red. The one place a hex reaches a third party, because their API takes a colour
      // string and not a class.
      theme: { color: "#B20003" },
      handler: (response) => {
        setStatus("verifying");
        /*
         * Best effort. The webhook is what the seat count trusts, so a failed verify call here
         * costs nothing but a slower confirmation page; the redirect happens either way.
         */
        void fetch("/api/payments/verify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            bookingId: order.bookingId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          }),
        })
          .catch(() => undefined)
          .finally(() => {
            router.push(`/booking/${order.bookingId}`);
          });
      },
      modal: {
        ondismiss: () => {
          setStatus("idle");
          track("booking_failed", { course_id: courseSlug, reason: "dismissed" });
        },
      },
    });

    checkout.on("payment.failed", () => {
      setStatus("idle");
      setErrors({ form: "That payment did not go through. Try again, or message us on WhatsApp." });
      track("booking_failed", { course_id: courseSlug, reason: "payment_failed" });
    });

    checkout.open();
  }

  if (soldOut) {
    return (
      <div className={cn("border border-white-2 bg-white-3 p-6 md:p-8", className)}>
        <h2 className="type-h3 text-black">The last seat has gone</h2>
        <p className="mt-3 measure type-body text-grey">
          Someone booked it while you were filling this in. Nothing has been charged. Join the
          waiting list for this batch and the academy will tell you first when a seat frees up or a
          new date is set.
        </p>
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
          <WhatsAppButtonClient course={courseTitle} event="whatsapp_click_soldout">
            Ask about the next batch
          </WhatsAppButtonClient>
          <Link
            href={`/enquire?course=${courseSlug}`}
            className="inline-flex min-h-11 items-center type-body text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
          >
            Join the waiting list
          </Link>
        </div>
      </div>
    );
  }

  const busy = status !== "idle";

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
        Your details
      </h2>

      <Field id={field("name")} label="Your name" required error={errors.name} errorId={field("name-error")}>
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
        hint="We confirm the batch on WhatsApp, so use the number WhatsApp is on."
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
            aria-describedby={cn(field("phone-hint"), errors.phone ? field("phone-error") : "").trim()}
            className={cn(fieldInputClass, "rounded-l-none")}
          />
        </div>
      </Field>

      <Field
        id={field("email")}
        label="Email"
        required
        hint="Where the receipt and the joining details go."
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

      {prerequisite && (
        <div className="flex flex-col gap-2">
          <label
            htmlFor={field("prerequisiteAccepted")}
            className="flex min-h-11 cursor-pointer items-start gap-3 py-1 type-body text-black"
          >
            {/* The box gets its own 44px cell. The label around it already makes the whole
                row clickable; this is so the box a thumb aims at is a target too. */}
            <span className="-m-2.5 flex size-11 shrink-0 items-center justify-center">
              <input
                id={field("prerequisiteAccepted")}
                name="prerequisiteAccepted"
                type="checkbox"
                checked={prerequisiteAccepted}
                onChange={(event) => setPrerequisiteAccepted(event.target.checked)}
                onBlur={onBlur("prerequisiteAccepted")}
                aria-invalid={Boolean(errors.prerequisiteAccepted)}
                aria-describedby={
                  errors.prerequisiteAccepted ? field("prerequisiteAccepted-error") : undefined
                }
              className="size-6 shrink-0 accent-red"
              />
            </span>
            <span>I confirm I meet the prerequisite: {prerequisite}</span>
          </label>
          <FieldError id={field("prerequisiteAccepted-error")} message={errors.prerequisiteAccepted} />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label
          htmlFor={field("consent")}
          className="flex min-h-11 cursor-pointer items-start gap-3 py-1 type-body text-black"
        >
          {/* The box gets its own 44px cell. The label around it already makes the whole
              row clickable; this is so the box a thumb aims at is a target too. */}
          <span className="-m-2.5 flex size-11 shrink-0 items-center justify-center">
            <input
              id={field("consent")}
              name="consent"
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              onBlur={onBlur("consent")}
              aria-invalid={Boolean(errors.consent)}
              aria-describedby={errors.consent ? field("consent-error") : undefined}
              className="size-6 shrink-0 accent-red"
            />
          </span>
          <span>
            The academy may contact me about this booking. See the{" "}
            <Link href="/privacy" className="text-red underline decoration-1 underline-offset-4">
              privacy note
            </Link>{" "}
            and the{" "}
            <Link href="/refund-policy" className="text-red underline decoration-1 underline-offset-4">
              refund and reschedule policy
            </Link>
            .
          </span>
        </label>
        <FieldError id={field("consent-error")} message={errors.consent} />
      </div>

      {/* Honeypot. Hidden from everyone, including a screen reader; only a script fills it. */}
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

      <Turnstile siteKey={turnstileSiteKey} onToken={onToken} className="min-h-[65px]" />

      <FieldError id={field("form-error")} message={errors.form} />

      <div className="hairline flex flex-col gap-4 pt-6">
        <p className="flex items-start gap-2 type-small text-grey">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            Payment is taken by Razorpay. Espresso Academy India never sees your card details.
          </span>
        </p>
        <Button type="submit" variant="primary" size="block" disabled={busy} data-event="pay_click">
          {busy && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
          {status === "idle" &&
            /* "the ₹5,000 advance", not "₹5,000": content/rules asks every price to be
               qualified, and a bare figure on the pay button reads as the price of the course.
               "+ GST" would be worse here, because ₹5,000 is exactly what the gateway charges. */
            (paymentType === "advance"
              ? `Pay the ₹${amount.toLocaleString("en-IN")} advance and confirm the seat`
              : `Pay ₹${amount.toLocaleString("en-IN")} and book the seat`)}
          {status === "creating" && "Opening the payment window"}
          {status === "paying" && "Waiting for the payment"}
          {status === "verifying" && "Confirming your booking"}
        </Button>
        {paymentType === "advance" && balance > 0 && (
          /* Directly under the button, not up beside the fee. This is the sentence that stops a
             student believing the course is paid for, and it has to be the last thing read before
             the payment window opens. */
          <p className="type-small text-grey">
            The balance of ₹{balance.toLocaleString("en-IN")}
            {gstIncluded ? " incl. GST" : " + GST"} is paid to the academy before the first day.
            This payment confirms your seat, it does not pay for the course in full.
          </p>
        )}
        <p aria-live="polite" className="sr-only">
          {status === "verifying" ? "Payment received. Confirming your booking." : ""}
        </p>
      </div>
    </form>
  );
}
