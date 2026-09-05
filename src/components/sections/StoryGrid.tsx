import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { getStories } from "@/lib/content";
import { cn } from "@/lib/utils";

interface StoryGridProps {
  className?: string;
  number?: string;
}

/**
 * Student stories. content/facts.md forbids any testimonial until a real, permitted one arrives,
 * so this section stays in its empty state. Never fill it with a plausible quote.
 */
export function StoryGrid({ className, number = "05" }: StoryGridProps) {
  const stories = getStories();

  return (
    <section className={cn("section-y", className)} aria-labelledby="stories-heading">
      <Container>
        <SectionHeading
          number={number}
          eyebrow="Students"
          title="Student stories"
          id="stories-heading"
        />

        {stories.length === 0 ? (
          <div className="mt-10 grid gap-8 border border-white-2 p-6 md:mt-14 md:p-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="type-h3 text-black">No student stories are published yet</p>
              <p className="mt-3 measure type-body text-grey">
                A story appears here only when the student has read it and agreed to it. Until
                then this space stays empty rather than carrying a quote nobody said. To hear from
                a past student before you enrol, ask the academy.
              </p>
            </div>
            {/* min-w-0 and a shorter label: the button carries `shrink-0`, so at 360 the old
                29-character label made a 321px pill in a 272px column and pushed the homepage
                6px sideways. The paragraph above already says "past student". */}
            <div className="flex min-w-0 items-start lg:col-span-5 lg:justify-end">
              <WhatsAppButton
                message="Hi, I would like to speak to a past student before I enrol. Is that possible?"
                event="whatsapp_click_stories"
              >
                Speak to a student
              </WhatsAppButton>
            </div>
          </div>
        ) : (
          <ul className="mt-10 grid gap-8 md:mt-14 md:grid-cols-2 lg:grid-cols-3">
            {stories.map((story) => (
              <li key={story.id} className="border border-white-2 p-6">
                <blockquote className="type-body text-black">
                  <p>{story.quote}</p>
                </blockquote>
                <p className="mt-4 type-small text-grey">
                  <span className="text-black">{story.name}</span>, {story.course}. {story.outcome}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}
