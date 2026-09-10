import { Container } from "@/components/site/Container";
import { getSiteSettings } from "@/lib/content";
import { cn } from "@/lib/utils";

interface ProofItem {
  /** The figure. Bebas when it is a numeral, Montserrat when it is a word. */
  figure: string;
  /** True only for actual numbers: design.md reserves Bebas for numerals, not for words. */
  numeral?: boolean;
  /** The claim. Every one traces to a line in content/facts.md. */
  label: string;
}

/**
 * Five facts, each traceable to content/facts.md. No counts, no ratings, no awards: the file
 * carries none of those, so neither does the site.
 *
 * The two years come from settings rather than from a literal, so the day the academy corrects one
 * it is corrected here too. The other three are statements, not values, and have no field.
 */
function buildItems(foundedFlorence: number, launchedBengaluru: number): ProofItem[] {
  return [
    {
      figure: String(foundedFlorence),
      numeral: true,
      label: `Coffee education in Florence since ${foundedFlorence}`,
    },
    {
      figure: String(launchedBengaluru),
      numeral: true,
      label: `Teaching in Bengaluru since ${launchedBengaluru}`,
    },
    /* facts.md line 79: "17 branches worldwide" is superseded by the client's "over 30". The
       numeral carries the "over", which is how the brand sets figures elsewhere. */
    {
      figure: "30+",
      numeral: true,
      label: "Branches worldwide, and this one is an Official Partner of Espresso Academy, Florence",
    },
    { figure: "Italy", label: "IBC diplomas are issued in Italy by Espresso Academy, Florence" },
    /* facts.md, Trainers: one named trainer, one Q Grader certification. This read "Faculty hold
       Q Grader and CQI Q Processing credentials", which was plural about a roster of one and named
       a CQI credential belonging to a trainer who is not part of the academy's team. */
    { figure: "Q Grader", label: "The trainer at the Bengaluru campus is a certified Q Grader" },
  ];
}

interface ProofStripProps {
  className?: string;
}

export async function ProofStrip({ className }: ProofStripProps) {
  const settings = await getSiteSettings();
  const items = buildItems(settings.foundedFlorence, settings.launchedBengaluru);

  return (
    <section className={cn("border-b border-white-2 bg-white-3", className)} aria-labelledby="proof-heading">
      <Container className="py-10 md:py-14">
        <h2 id="proof-heading" className="sr-only">
          What the academy is
        </h2>
        {/*
          A stat row, not a marquee. design.md caps motion at 400ms and lists "over-animated
          portfolio" among the registers this site must never occupy, and a marquee is unbounded
          motion that also takes five facts a reader wants to compare and slides them past each
          other. Five figures on one rail can be read at a glance and are still there a second
          later.

          One grey hairline over the whole band, and a short red tick over each figure: the same
          mark the photo placeholders carry, so the two read as one family. The fifth item spans
          both columns on mobile so it does not orphan in a half row.

          `grid-rows-subgrid` puts the tick, the figure and the label of every item on the row's own
          three tracks, so the five labels start at one height. Without it the grid sized each cell
          independently and the label under "30+" began 8px below the label under "Italy": five
          facts presented as a set, on five different baselines.
        */}
        <ul className="hairline grid grid-cols-2 gap-x-6 gap-y-10 pt-8 lg:grid-cols-5 lg:gap-8">
          {items.map((item, index) => (
            <li
              key={item.label}
              className={cn(
                /* gap-y-0 overrides the row gap this subgrid would otherwise inherit from the
                   list. The 40px that separates one fact from the next is not the spacing that
                   belongs between a tick, its figure and its label; without the override it was
                   applied three times inside every item. The children carry their own. */
                "grid grid-rows-subgrid row-span-3 gap-y-0",
                index === items.length - 1 && items.length % 2 === 1 && "col-span-2 lg:col-span-1",
              )}
            >
              <span aria-hidden="true" className="block h-px w-6 self-start bg-red" />
              {/*
                One optical size for all five, because all five are the same kind of claim.
                design.md reserves Bebas for numerals, so "Italy" and "Q Grader" stay Montserrat —
                but they were also two steps smaller than the years beside them, which turned the
                row into three statistics and two footnotes.
              */}
              <p
                className={cn(
                  "mt-4 self-end text-h2 text-black md:text-h2-lg",
                  item.numeral ? "type-numeral" : "font-sans font-medium",
                )}
              >
                {item.figure}
              </p>
              <p className="mt-2 type-small text-balance text-grey">{item.label}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
