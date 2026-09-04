"use client";

// Client: an error boundary has to be a Client Component in the App Router.

import { useEffect } from "react";
import Link from "next/link";
import { Container } from "@/components/site/Container";
import { Button, ButtonLink } from "@/components/site/Button";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(JSON.stringify({ at: "app/error", digest: error.digest, message: error.message }));
  }, [error]);

  return (
    <Container className="py-16 md:py-28">
      <p className="eyebrow">Something broke</p>
      <h1 className="mt-4 type-h1 text-black">This page did not load</h1>
      <p className="mt-5 measure type-body text-grey">
        The fault is ours, not yours. Try again, and if it still will not load, message the
        academy on WhatsApp. Someone will answer with whatever you were looking for.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
        <ButtonLink href="/courses" variant="secondary">
          See all courses
        </ButtonLink>
        <WhatsAppButton event="whatsapp_click_error" />
      </div>

      {error.digest && (
        <p className="mt-10 type-small text-grey">
          If you tell us this reference it helps us find the fault:{" "}
          <code className="text-black">{error.digest}</code>
        </p>
      )}

      <p className="mt-6 type-small text-grey">
        Or go back to the{" "}
        <Link href="/" className="text-red underline decoration-1 underline-offset-4 hover:text-red-deep">
          home page
        </Link>
        .
      </p>
    </Container>
  );
}
