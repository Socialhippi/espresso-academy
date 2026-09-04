/** First focusable thing in the DOM, per .claude/rules/a11y.md. */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only rounded-xs bg-black px-4 py-3 text-body font-medium text-white focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-100"
    >
      Skip to main content
    </a>
  );
}
