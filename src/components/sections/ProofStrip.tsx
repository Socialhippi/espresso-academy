import { Container } from "@/components/site/Container";
import { siteSettings } from "@/lib/content";
import { cn } from "@/lib/utils";

interface ProofItem {
  /** Bebas numeral or short figure. */
  figure: string;
  /** The claim. Every one traces to a line in content/facts.md. */
  label: string;
}

/**
 * Five facts, each traceable to content/facts.md. No counts, no ratings, no awards: the file
 * carries none of those, so neither does the site.
 */
const items: ProofItem[] = [
  { figure: String(siteSettings.foundedFlorence), label: "Coffee education in Florence since 2007" },
  { figure: String(siteSettings.launchedBengaluru), label: "Teaching in Bengaluru since 2023" },
  { figure: "Partner", label: "Official Partner of Espresso Academy, Florence" },
  { figure: "Italy", label: "IBC diplomas are issued in Italy and sent to partner schools" },
  { figure: "Q Grader", label: "Faculty hold Q Grader and CQI Q Processing credentials" },
];

interface ProofStripProps {
  className?: string;
}

export function ProofStrip({ className }: ProofStripProps) {
  return (
    <section className={cn("border-b border-white-2 bg-white-3", className)} aria-labelledby="proof-heading">
      <Container className="py-10 md:py-14">
        <h2 id="proof-heading" className="sr-only">
          What the academy is
        </h2>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-5 md:gap-8">
          {items.map((item) => (
            <li key={item.label} className="border-t border-white-2 pt-4">
              <p className="type-numeral text-h2 text-black">{item.figure}</p>
              <p className="mt-2 type-small text-grey">{item.label}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
