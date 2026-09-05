import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { cn } from "@/lib/utils";

interface Door {
  number: string;
  title: string;
  body: string;
  href: string;
  cta: string;
}

const doors: Door[] = [
  {
    number: "01",
    title: "I want to work as a barista",
    body: "Start at foundation level, on a machine, and work towards a certificate you can show.",
    href: "/courses?level=foundation",
    cta: "See foundation courses",
  },
  {
    number: "02",
    title: "I run or am opening a cafe",
    body: "Ask about training a team. Whether the academy runs cafe or team training is not published yet.",
    href: "/contact?topic=cafe",
    cta: "Ask about team training",
  },
  {
    number: "03",
    title: "I love coffee and want to learn",
    body: "Brewing, latte art, and roasting and cupping are all taught at all levels.",
    href: "/courses?level=open",
    cta: "See open-level courses",
  },
];

interface AudienceDoorsProps {
  className?: string;
  number?: string;
}

/** Three routes into the site, one per reader. Full-width on mobile, three-up from md. */
export function AudienceDoors({ className, number = "01" }: AudienceDoorsProps) {
  return (
    <section className={cn("section-y", className)} aria-labelledby="doors-heading">
      <Container>
        <SectionHeading
          number={number}
          eyebrow="Where to start"
          title="Three ways in"
          id="doors-heading"
          description="Pick the one that sounds like you. Each goes straight to the courses that fit."
        />

        <ul className="mt-10 grid gap-px border border-white-2 bg-white-2 md:mt-14 lg:grid-cols-3">
          {doors.map((door) => (
            <li key={door.href} className="group bg-white">
              <Link href={door.href} className="flex h-full flex-col p-6 md:p-8">
                {/* No card numeral: the section eyebrow already carries a red Bebas number, and
                    two numbering systems in one section compete. */}
                <h3 className="type-h3 text-black group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
                  {door.title}
                </h3>
                <p className="mt-3 type-body text-grey">{door.body}</p>
                <span className="mt-auto flex items-center gap-2 pt-8 type-label text-red">
                  {door.cta}
                  <ArrowRight
                    className="size-4 transition-transform duration-200 ease-out-brand group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
