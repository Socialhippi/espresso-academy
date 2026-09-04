interface WhatsAppGlyphProps {
  className?: string;
}

/**
 * The WhatsApp glyph. lucide-react dropped its brand icons, so the mark is inlined here rather
 * than substituting a generic speech bubble, which would misrepresent where the message goes.
 */
export function WhatsAppGlyph({ className }: WhatsAppGlyphProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91A9.85 9.85 0 0 0 19.06 4.9 9.85 9.85 0 0 0 12.04 2Zm0 1.67c2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.25 8.24a8.23 8.23 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.26-8.24Zm-4.5 4.44c-.21 0-.55.08-.84.39-.29.31-1.1 1.08-1.1 2.63 0 1.55 1.13 3.05 1.29 3.26.16.21 2.19 3.34 5.3 4.55 2.59 1 3.12.8 3.68.75.56-.05 1.81-.74 2.07-1.45.25-.71.25-1.32.18-1.45-.08-.13-.29-.21-.6-.36-.31-.16-1.81-.9-2.09-1-.28-.1-.49-.16-.69.16-.21.31-.79.99-.97 1.2-.18.2-.36.23-.66.08-.31-.16-1.3-.48-2.47-1.53a9.28 9.28 0 0 1-1.72-2.13c-.18-.31-.02-.48.13-.63.14-.14.31-.36.47-.55.15-.18.2-.31.31-.52.1-.21.05-.39-.03-.55-.08-.15-.68-1.66-.95-2.27-.24-.58-.49-.5-.68-.51h-.58Z" />
    </svg>
  );
}
