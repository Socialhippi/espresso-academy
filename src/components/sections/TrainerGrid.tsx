import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Placeholder } from "@/components/site/Placeholder";
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
        {trainer.image ? (
          <Image
            src={trainer.image}
            alt={`${trainer.name}, trainer at Espresso Academy India`}
            width={800}
            height={1000}
            priority={priority}
            sizes="(min-width: 1024px) 360px, (min-width: 768px) 30vw, 90vw"
            className="aspect-portrait w-full rounded-sm object-cover"
          />
        ) : (
          <Placeholder slot={`trainer-${trainer.slug}`} aspect="portrait" />
        )}

        <h3 className="mt-5 type-h3 text-black group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
          {trainer.name}
        </h3>

        {/* TODO(client): trainer.role. Job titles are not published anywhere yet. */}
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

        <span className="mt-auto flex items-center gap-2 pt-5 type-label text-red">
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
  return (
    <ul className={cn("grid gap-10 md:grid-cols-3 md:gap-6 lg:gap-8", className)}>
      {trainers.map((trainer, index) => (
        <li key={trainer.slug}>
          <TrainerCard trainer={trainer} priority={index === 0} />
        </li>
      ))}
    </ul>
  );
}
