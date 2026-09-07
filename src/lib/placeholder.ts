/**
 * Authoring placeholders, kept off the public site.
 *
 * `pnpm sanity:seed:templates` writes real documents whose every paragraph reads "PLACEHOLDER.
 * One or two sentences that answer the question in the title outright…". That is deliberate: the
 * shape of the page is what the seed is for, and a marked placeholder is how the academy finds the
 * paragraphs it has to write. What was not deliberate is that those sentences rendered on
 * /for-cafes and /guides, where a reader met "PLACEHOLDER" as the answer to the question they had
 * just clicked.
 *
 * Filtering here rather than in each page means the rule holds for any field, on any template, and
 * for anything the academy pastes in later that still carries the marker. A stripped field falls
 * back to whatever the page already does with an empty one, which is the honest TBC state it was
 * built with.
 *
 * Pure and dependency-free so the unit suite can exercise it directly.
 */

const MARKER = /^\s*(TODO|PLACEHOLDER|LOREM IPSUM)\b/i;

/** True when this string is authoring scaffolding rather than something a reader should see. */
export function isPlaceholder(value: string | null | undefined): boolean {
  const trimmed = value?.trim();
  if (!trimmed) return true;
  return MARKER.test(trimmed);
}

/** The string, or null when it is a placeholder or empty. */
export function stripPlaceholder(value: string | null | undefined): string | null {
  return isPlaceholder(value) ? null : (value as string);
}

/**
 * The same rule over a list: every entry that is a placeholder is dropped, and a list with nothing
 * left becomes null rather than an empty list, so a caller's `?? fallback` still fires.
 */
export function stripPlaceholderList<T>(
  items: readonly T[] | null | undefined,
  text: (item: T) => string | null | undefined,
): T[] | null {
  if (!items || items.length === 0) return null;
  const kept = items.filter((item) => !isPlaceholder(text(item)));
  return kept.length > 0 ? kept : null;
}

/**
 * True when anything anywhere inside this value is still authoring scaffolding.
 *
 * Used to drop a whole page section rather than a single string: a section whose prose reads
 * "PLACEHOLDER. One sentence saying what the academy does for a cafe team" is not a section with a
 * missing sentence, it is a section nobody has written. Dropping it lets /for-cafes fall back to
 * the hand-written copy it already ships, which says only what facts.md supports.
 *
 * Keys beginning with an underscore are Sanity's own (`_type`, `_key`, `_ref`) and are skipped.
 */
export function containsPlaceholder(value: unknown): boolean {
  if (typeof value === "string") return MARKER.test(value.trim());
  if (Array.isArray(value)) return value.some(containsPlaceholder);
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).some(
      ([key, entry]) => !key.startsWith("_") && containsPlaceholder(entry),
    );
  }
  return false;
}
