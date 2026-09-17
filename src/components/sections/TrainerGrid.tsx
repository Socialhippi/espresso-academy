import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SanityPhoto } from "@/components/site/SanityPhoto";
import { TbcPill } from "@/components/site/TbcPill";
import type { Trainer } from "@/lib/content";
import { cn } from "@/lib/utils";

interface TrainerCardProps {
  trainer: Trainer;
  className?: string;
  priority?: boolean;
}

/** One trainer: 4:5 photo slot, name, role, and the credentials that are on record. */
export function TrainerCard({ trainer, className, priority = false }: TrainerCardProps) {
  return (
    /* h-full so the article fills its grid row and the Link's own h-full has something to resolve
       against: without it the three cards ended 21px apart wherever a credential wrapped, which
       is every width from 768 to 1079. CourseCard already pairs `group h-full` with `mt-auto`. */
    <article className={cn("group h-full", className)}>
      <Link href={`/trainers/${trainer.slug}`} className="flex h-full flex-col">
        <SanityPhoto
          image={trainer.image}
          slot={`trainer-${trainer.slug}`}
          fallbackAlt={`${trainer.name}, trainer at Espresso Academy India`}
          aspect="portrait"
          priority={priority}
          sizes="(min-width: 1024px) 360px, (min-width: 768px) 30vw, 90vw"
          className="rounded-sm"
        />

        <h3 className="mt-5 type-h3 text-black group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
          {trainer.name}
        </h3>

        {/* TODO(client): trainer.role. No job title is published for the one trainer on the
            roster, and facts.md still carries it as an open question. */}
        <p className="mt-2 flex items-center gap-2 type-small text-grey">
          {trainer.role ?? <TbcPill label="Role TBC" />}
        </p>

        <ul className="mt-4 flex flex-col gap-2 type-small text-grey">
          {trainer.credentials.slice(0, 3).map((credential) => (
            <li key={credential.name} className="border-t border-white-2 pt-2">
              {credential.name}
            </li>
          ))}
        </ul>

        {/* type-body: design.md's 16px floor under red text. */}
        <span className="mt-auto flex items-center gap-2 pt-6 type-body font-medium text-red">
          Read the profile
          <ArrowRight
            className="size-4 transition-transform duration-200 ease-out-brand group-hover:translate-x-1"
            aria-hidden="true"
          />
        </span>
      </Link>
    </article>
  );
}

interface TrainerGridProps {
  trainers: Trainer[];
  className?: string;
}

export function TrainerGrid({ trainers, className }: TrainerGridProps) {
  /*
   * The columns follow the count. It was a fixed `md:grid-cols-3`, which was right while there
   * were three trainers and became two empty thirds beside a lonely card the day the client
   * confirmed there is one. A single card capped at `max-w-md` reads as a profile; the same card
   * stretched across a third of a 1280 viewport reads as a page that has lost its data.
   */
  const columns =
    trainers.length === 1
      ? "max-w-md"
      : trainers.length === 2
        ? "md:grid-cols-2"
        : "md:grid-cols-3";

  return (
    <ul className={cn("grid gap-10 md:gap-6 lg:gap-8", columns, className)}>
      {trainers.map((trainer, index) => (
        <li key={trainer.slug}>
          <TrainerCard trainer={trainer} priority={index === 0} />
        </li>
      ))}
    </ul>
  );
}
