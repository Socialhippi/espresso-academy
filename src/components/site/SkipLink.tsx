/** First focusable thing in the DOM, per .claude/rules/a11y.md. */
export function SkipLink() {
  return (
    <a
      href="#main"
      /* The padding has to live in the focus variant. Tailwind's `not-sr-only` sets padding:0,
         and it wins over a base `px-4 py-3`, so the link unhid itself as an unpadded 170x26 slab
         with the text touching all four edges, against the 44px target rule. It is the first
         thing a keyboard user ever sees on the site. */
      className="sr-only rounded-xs bg-black text-body font-medium text-white focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-100 focus:inline-flex focus:min-h-11 focus:items-center focus:px-4 focus:py-3"
    >
      Skip to main content
    </a>
  );
}
