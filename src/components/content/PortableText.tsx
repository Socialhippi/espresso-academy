import Link from "next/link";
import {
  PortableText as BasePortableText,
  type PortableTextComponents,
} from "@portabletext/react";
import { AlertTriangle, Info } from "lucide-react";
import { SanityPhoto } from "@/components/site/SanityPhoto";
import type { SanityImage } from "@/lib/sanity/image";
import { cn } from "@/lib/utils";

/**
 * Portable text, rendered with the site's own type scale and the tokens.
 *
 * The renderer decides the colours, not the editor: `design.md` forbids red text on a dark ground
 * and mustard as a text colour anywhere, and a callout whose tone is picked in the Studio would be
 * one place a rule could be broken without anybody rebuilding the site. The tone field chooses
 * between two vetted pairs and nothing else.
 *
 * H1 is not a style an editor can pick either: the page title is the H1, and a body that could set
 * its own would break the heading order the tests assert.
 */

interface CalloutValue {
  tone?: "note" | "warning";
  title?: string;
  body: string;
}

interface EvidenceTableValue {
  caption: string;
  columns: string[];
  rows: { _key?: string; cells: string[] }[];
}

interface FaqBlockValue {
  heading?: string;
  items: { _key?: string; q: string; a: string; link?: { label: string; href: string } | null }[];
}

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className="mt-5 measure type-body text-grey">{children}</p>,
    h2: ({ children }) => <h2 className="mt-12 type-h2 text-black">{children}</h2>,
    h3: ({ children }) => <h3 className="mt-8 type-h3 text-black">{children}</h3>,
    blockquote: ({ children }) => (
      <blockquote className="mt-8 border-l-2 border-red pl-5 measure type-body text-black">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mt-5 flex flex-col gap-2 measure type-body text-grey">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="mt-5 flex list-decimal flex-col gap-2 pl-5 measure type-body text-grey">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => (
      <li className="flex gap-3">
        <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 bg-red" />
        <span>{children}</span>
      </li>
    ),
    number: ({ children }) => <li>{children}</li>,
  },
  marks: {
    strong: ({ children }) => <strong className="font-medium text-black">{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    link: ({ value, children }) => {
      const href = String((value as { href?: string } | undefined)?.href ?? "");
      const internal = href.startsWith("/");
      const className =
        "text-red underline decoration-1 underline-offset-4 hover:text-red-deep";
      if (internal) {
        return (
          <Link href={href} className={className}>
            {children}
          </Link>
        );
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
          {children}
        </a>
      );
    },
  },
  types: {
    brandImage: ({ value }) => {
      const image = value as SanityImage;
      return (
        <figure className="mt-10">
          <SanityPhoto
            image={image}
            slot="guide-image"
            fallbackAlt="Photograph from Espresso Academy India"
            aspect="photo"
            sizes="(min-width: 1024px) 760px, 100vw"
          />
          {image.alt && (
            <figcaption className="mt-3 type-small text-grey">{image.alt}</figcaption>
          )}
        </figure>
      );
    },

    calloutBlock: ({ value }) => {
      const callout = value as CalloutValue;
      const warning = callout.tone === "warning";
      return (
        <aside
          className={cn(
            "mt-8 flex gap-3 border p-5",
            warning ? "border-red bg-white" : "border-white-2 bg-white-3",
          )}
        >
          <span className={cn("mt-0.5 shrink-0", warning ? "text-red" : "text-grey")}>
            {warning ? (
              <AlertTriangle className="size-5" aria-hidden="true" />
            ) : (
              <Info className="size-5" aria-hidden="true" />
            )}
          </span>
          <div>
            {callout.title && <p className="type-h3 text-black">{callout.title}</p>}
            <p className={cn("measure type-body text-grey", callout.title && "mt-2")}>
              {callout.body}
            </p>
          </div>
        </aside>
      );
    },

    evidenceTableBlock: ({ value }) => {
      const table = value as EvidenceTableValue;
      return (
        <figure className="mt-10">
          {/* .table-scroll, not overflow-x-auto: the screen-reader-only caption inside a table is
              absolutely positioned and escapes a plain scroll container, which pushed the whole
              document 209px wide at 390 the first time this was built. */}
          <div className="table-scroll">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">{table.caption}</caption>
              <thead>
                <tr className="border-b border-black">
                  {table.columns.map((column) => (
                    <th key={column} scope="col" className="py-3 pr-4 type-label text-grey">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, rowIndex) => (
                  <tr key={row._key ?? rowIndex} className="border-b border-white-2 align-top">
                    {row.cells.map((cell, cellIndex) => (
                      <td
                        key={`${row._key ?? rowIndex}-${cellIndex}`}
                        className="py-4 pr-4 type-small text-black"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <figcaption className="mt-3 type-small text-grey">{table.caption}</figcaption>
        </figure>
      );
    },

    faqBlock: ({ value }) => {
      const block = value as FaqBlockValue;
      return (
        <section className="mt-12 hairline pt-8">
          <h2 className="type-h2 text-black">{block.heading ?? "Common questions"}</h2>
          <dl className="mt-8 flex flex-col gap-8">
            {block.items.map((item, index) => (
              <div key={item._key ?? index}>
                <dt className="type-h3 text-black">{item.q}</dt>
                <dd className="mt-2 measure type-body text-grey">
                  {item.a}
                  {item.link && (
                    <>
                      {" "}
                      <Link
                        href={item.link.href}
                        className="text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
                      >
                        {item.link.label}
                      </Link>
                    </>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      );
    },
  },
};

/**
 * A portable-text body as the queries return it.
 *
 * Typed structurally rather than with `PortableTextBlock` from `@portabletext/types`: that package
 * is a transitive dependency of the renderer, and importing from it directly would make this file
 * break the day the renderer changes which version it pulls in.
 */
export type PortableTextValue = { _type: string; _key?: string }[] | null | undefined;

interface PortableTextProps {
  value: PortableTextValue;
  className?: string;
}

export function PortableText({ value, className }: PortableTextProps) {
  if (!value || value.length === 0) return null;
  return (
    <div className={className}>
      <BasePortableText value={value} components={components} />
    </div>
  );
}

/** The questions inside a body, for FAQPage structured data. */
export function faqEntriesFromBody(
  value: PortableTextValue,
): { q: string; a: string }[] {
  if (!value) return [];
  const out: { q: string; a: string }[] = [];
  for (const block of value) {
    if ((block as { _type?: string })._type !== "faqBlock") continue;
    const items = (block as unknown as FaqBlockValue).items ?? [];
    for (const item of items) {
      if (item.q && item.a) out.push({ q: item.q, a: item.a });
    }
  }
  return out;
}
