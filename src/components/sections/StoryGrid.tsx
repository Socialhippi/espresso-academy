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
          title="Where our students end up"
          id="stories-heading"
        />

        {stories.length === 0 ? (
          <div className="mt-10 grid gap-8 border border-white-2 p-6 md:mt-14 md:grid-cols-12 md:p-10">
            <div className="md:col-span-7">
              <p className="type-h3 text-black">Student stories are coming soon</p>
              <p className="mt-3 measure type-body text-grey">
                We only publish a story when the student has read it and agreed to it. Until then
                this space stays empty rather than carrying a quote nobody said. If you want to
                hear from a graduate before you enrol, ask and we will put you in touch.
              </p>
            </div>
            <div className="flex items-start md:col-span-5 md:justify-end">
              <WhatsAppButton
                message="Hi, I'd like to speak to a graduate before I enrol. Can you put me in touch?"
                event="whatsapp_click_stories"
              >
                Ask to speak to a graduate
              </WhatsAppButton>
            </div>
          </div>
        ) : (
          <ul className="mt-10 grid gap-8 md:mt-14 md:grid-cols-3">
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
