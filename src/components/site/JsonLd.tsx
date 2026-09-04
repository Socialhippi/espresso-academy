interface JsonLdProps {
  /** A schema.org @graph or a single node. Serialised into a script tag. */
  data: unknown;
  /** Distinguishes multiple blocks on one page in tests and in the DOM. */
  id?: string;
}

/**
 * Structured data. The JSON is escaped so a "<" inside a string can never close the script tag.
 */
export function JsonLd({ data, id }: JsonLdProps) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      id={id}
      // The payload is built from content/data.ts, not from user input, and is escaped above.
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
