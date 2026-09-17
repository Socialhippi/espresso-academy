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
  /**
   * A second destination, rendered as a band under the card rather than inside it.
   *
   * A link cannot contain a link, and .claude/rules/a11y.md makes the card itself one. This is
   * the same shape CourseCard uses for its book band, and it exists for one door: latte art and
   * brewing are days 4 and 2 of the same course, and sending someone who wants brewing to the
   * latte art day would be the site answering a question they did not ask.
   */
  secondary?: { href: string; cta: string };
}

const IBC_BASIC = "/courses/italian-barista-course-basic";

/**
 * Three routes into the site, one per reader.
 *
 * Revision 2 of content/facts.md cut the catalogue to three courses, and two of these doors were
 * pointing at filtered lists that no longer have anything in them: `?level=foundation` and
 * `?level=open` were built for a catalogue with eight courses on two ladders. A door has to open
 * onto something, so each one now opens onto a course, or onto the day of a course that teaches
 * the thing the reader came for.
 */
const doors: Door[] = [
  {
    number: "01",
    title: "I want to work as a barista",
    /* facts.md, IBC Basic: days 1 and 2 are roasting and manual brewing, not machine time, and
       the Basic Barista Exam is on day 3. Day 4 is latte art, so the course does not end on it. */
    body: "Take the IBC Basic. Four days, one module a day, with the Basic Barista Exam on day 3 and a certificate issued in Italy. It assumes you have never pulled a shot.",
    href: IBC_BASIC,
    cta: "See the four days",
  },
  {
    number: "02",
    title: "I run or am opening a cafe",
    body: "Ask about training a team. Whether the academy runs cafe or team training is not published yet, so you will get options rather than a package.",
    href: "/contact?topic=cafe",
    cta: "Ask about team training",
  },
  {
    number: "03",
    title: "I love coffee and want to learn",
    /* facts.md, Courses: latte art and brewing are days inside the IBC, not courses. Saying so
       here is more useful than a link that quietly redirects, because a reader deciding how to
       spend four days should know it is four days before they click. */
    body: "Latte art and brewing are not sold on their own. Latte art is day 4 of the IBC Basic and brewing is day 2, so you learn them inside the whole four days rather than in an afternoon.",
    href: `${IBC_BASIC}#day-4`,
    cta: "See the latte art day",
    secondary: { href: `${IBC_BASIC}#day-2`, cta: "See the brewing day" },
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
          description="Pick the one that sounds like you. Each goes straight to the course, or the day of the course, that covers it."
        />

        <ul className="mt-10 grid gap-px border border-white-2 bg-white-2 md:mt-14 lg:grid-cols-3">
          {doors.map((door) => (
            /* The flex column is the <li>, not the link inside it, so the secondary band sits
               inside the card's own box rather than overhanging the grid row. */
            <li key={door.href} className="group flex flex-col bg-white">
              <Link href={door.href} className="flex flex-1 flex-col p-6 md:p-8">
                {/* No card numeral: the section eyebrow already carries a red Bebas number, and
                    two numbering systems in one section compete. */}
                <h3 className="type-h3 text-black group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
                  {door.title}
                </h3>
                <p className="mt-3 type-body text-grey">{door.body}</p>
                {/* type-body, not type-label: design.md puts a 16px floor under red text, and this is
                    the card's call to action. Same resolution as src/app/courses/page.tsx. */}
                <span className="mt-auto flex items-center gap-2 pt-8 type-body font-medium text-red">
                  {door.cta}
                  <ArrowRight
                    className="size-4 transition-transform duration-200 ease-out-brand group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </Link>
              {door.secondary && (
                <Link
                  href={door.secondary.href}
                  /* 14px sentence case, not a 12px uppercase label: design.md puts a 16px floor
                     under red text, and this band sits on white-3 where the same rule applies. */
                  className="flex min-h-12 items-center justify-center border-t border-white-2 bg-white-3 px-6 py-3 type-body font-medium text-red hover:bg-red hover:text-white focus-visible:bg-red focus-visible:text-white"
                >
                  {door.secondary.cta}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
