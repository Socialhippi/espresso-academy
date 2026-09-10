import type { ReactNode } from "react";
import { Container } from "@/components/site/Container";
import { HeroMedia } from "@/components/sections/HeroMedia";
import { cn } from "@/lib/utils";

interface HomeHeroProps {
  /** Red uppercase label above the H1, matching the numbered eyebrows further down the page. */
  eyebrow?: string;
  /** Split so the gradient lands on the phrase that carries the meaning, not the whole line. */
  titleLead: string;
  titleAccent: string;
  subline: ReactNode;
  actions: ReactNode;
  /** Real photo path when the client has sent one; otherwise the reel, otherwise the placeholder. */
  image?: string | null;
  imageAlt?: string;
}

/**
 * The homepage hero. Asymmetric on desktop: the words hold the left seven columns and the picture
 * the right five, so the composition never reads as a centred SaaS masthead. The picture sits
 * beside the words, never behind them: text never sits on top of an image.
 *
 * The right column is a HeroMedia, which is the same frame whether it holds the client's reel, a
 * still photograph or the branded placeholder. Nothing about this layout changes when the footage
 * arrives, and nothing here has to be edited to let it in.
 *
 * This is the one place in the site allowed to use the red gradient on text (design.md).
 */
export function HomeHero({
  eyebrow,
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
        <div className="grid items-start gap-10 nav:grid-cols-12 nav:gap-12">
          <div className="nav:col-span-7">
            {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
            <h1 className="type-display text-black">
              {titleLead}{" "}
              <span className="hero-gradient-text">{titleAccent}</span>
            </h1>
            <div className="mt-6 measure type-body text-grey">{subline}</div>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
              {actions}
            </div>
          </div>

          <div className="nav:col-span-5">
            <HeroMedia image={image} alt={imageAlt} slot="hero" />
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
            "gap-10 nav:gap-12",
            aside ? "grid nav:grid-cols-12" : undefined,
            above ? "mt-6 md:mt-8" : undefined,
          )}
        >
          <div className={aside ? "nav:col-span-7" : undefined}>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h1 className={cn("type-h1 text-black", eyebrow && "mt-3")}>{title}</h1>
            {intro && <div className="mt-5 measure type-body text-grey">{intro}</div>}
            {actions && (
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                {actions}
              </div>
            )}
          </div>
          {aside && <div className="nav:col-span-5">{aside}</div>}
        </div>
      </Container>
    </section>
  );
}
