import { expect, test } from "@playwright/test";
import { isPlaceholder, stripPlaceholder, stripPlaceholderList } from "@/lib/placeholder";

/**
 * The seed writes "PLACEHOLDER." paragraphs on purpose. They reached the public site, which was
 * not on purpose: /guides offered "PLACEHOLDER. One or two sentences that answer the question in
 * the title outright" as the answer to the question in the title.
 */

test("the marker is caught however it is cased or spaced", () => {
  expect(isPlaceholder("PLACEHOLDER. One or two sentences.")).toBe(true);
  expect(isPlaceholder("  placeholder: what the academy needs to know")).toBe(true);
  expect(isPlaceholder("TODO: write this")).toBe(true);
  expect(isPlaceholder("Lorem ipsum dolor sit amet")).toBe(true);
});

test("empty and missing count as placeholder, so one check covers both", () => {
  expect(isPlaceholder(null)).toBe(true);
  expect(isPlaceholder(undefined)).toBe(true);
  expect(isPlaceholder("")).toBe(true);
  expect(isPlaceholder("   ")).toBe(true);
});

test("real copy is left alone, including copy that merely mentions the word", () => {
  expect(isPlaceholder("Two days on an espresso machine at the RMV 2nd Stage campus.")).toBe(false);
  // The photo placeholders are a real feature and say so in their own copy.
  expect(isPlaceholder("A branded placeholder stands in until the photograph arrives.")).toBe(false);
});

test("stripPlaceholder hands back null so a page's existing fallback fires", () => {
  expect(stripPlaceholder("PLACEHOLDER. Something.")).toBeNull();
  expect(stripPlaceholder("A real sentence.")).toBe("A real sentence.");
});

test("a list drops its placeholders and becomes null when nothing survives", () => {
  const items = [{ text: "PLACEHOLDER. One." }, { text: "We scope the session first." }];
  expect(stripPlaceholderList(items, (i) => i.text)).toEqual([
    { text: "We scope the session first." },
  ]);
  expect(stripPlaceholderList([{ text: "PLACEHOLDER. One." }], (i) => i.text)).toBeNull();
  expect(stripPlaceholderList([], (i: { text: string }) => i.text)).toBeNull();
  expect(stripPlaceholderList(null, (i: { text: string }) => i.text)).toBeNull();
});
