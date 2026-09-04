import type { ReactNode } from "react";
import Image from "next/image";
import { Container } from "@/components/site/Container";
import { Placeholder } from "@/components/site/Placeholder";
import { cn } from "@/lib/utils";

interface HomeHeroProps {
  /** Split so the gradient lands on the phrase that carries the meaning, not the whole line. */
  titleLead: string;
  titleAccent: string;
  subline: ReactNode;
  actions: ReactNode;
  /** Real photo path when the client has sent one; otherwise the branded placeholder. */
  image?: string | null;
  imageAlt?: string;
}

/**
 * The homepage hero. Asymmetric on desktop: the words hold the left seven columns and the photo
 * the right five, so the composition never reads as a centred SaaS masthead. The photo sits
 * beside the words, never behind them: text never sits on top of an image.
 *
 * This is the one place in the site allowed to use the red gradient on text (design.md).
 */
export function HomeHero({
  titleLead,
  titleAccent,
  subline,
  actions,
  image,
  imageAlt = "",
}: HomeHeroProps) {
  return (
    <section className="border-b border-white-2 pt-10 pb-14 md:pt-16 md:pb-24">
      <Container>
        <div className="grid items-center gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-7">
            <h1 className="type-display text-black">
              {titleLead}{" "}
              <span className="hero-gradient-text">{titleAccent}</span>
            </h1>
            <div className="mt-6 measure type-body text-grey">{subline}</div>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
              {actions}
            </div>
          </div>

          <div className="md:col-span-5">
            {image ? (
              <Image
                src={image}
                alt={imageAlt}
                width={1200}
                height={800}
                priority
                sizes="(min-width: 768px) 480px, 100vw"
                className="aspect-portrait w-full rounded-sm object-cover md:aspect-photo"
              />
            ) : (
              <Placeholder slot="hero" aspect="portrait" priority className="md:aspect-photo" />
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

interface PageHeroProps {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  /** Breadcrumbs, rendered above the heading. */
  above?: ReactNode;
  /** Actions under the intro. */
  actions?: ReactNode;
  /** Right-hand column, e.g. a spec strip or a photo. */
  aside?: ReactNode;
  className?: string;
}

/** The hero every page below home uses: breadcrumbs, eyebrow, H1, intro. */
export function PageHero({
  eyebrow,
  title,
  intro,
  above,
  actions,
  aside,
  className,
}: PageHeroProps) {
  return (
    <section className={cn("border-b border-white-2 pt-6 pb-10 md:pt-8 md:pb-16", className)}>
      <Container>
        {above}
        <div
          className={cn(
            "gap-10 md:gap-12",
            aside ? "grid md:grid-cols-12" : undefined,
            above ? "mt-6 md:mt-8" : undefined,
          )}
        >
          <div className={aside ? "md:col-span-7" : undefined}>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h1 className={cn("type-h1 text-black", eyebrow && "mt-3")}>{title}</h1>
            {intro && <div className="mt-5 measure type-body text-grey">{intro}</div>}
            {actions && (
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                {actions}
              </div>
            )}
          </div>
          {aside && <div className="md:col-span-5">{aside}</div>}
        </div>
      </Container>
    </section>
  );
}
