import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * The brand button, per .claude/rules/design.md: a 999px pill, 48px tall on mobile and 44px on
 * desktop, red on white for the primary action, black outline for the secondary, a red underlined
 * link for the tertiary, and a black ground for WhatsApp so red stays singular on the page.
 *
 * This is deliberately separate from src/components/ui/button.tsx: the shadcn primitive is 32px
 * tall by default and speaks shadcn's semantic palette rather than the brand's.
 */
export const buttonClasses = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-pill font-sans font-medium " +
    // Scoped so the focus outline appears instantly rather than fading in over 200ms.
    "transition-[color,background-color,border-color] duration-200 ease-out-brand " +
    "disabled:pointer-events-none aria-disabled:pointer-events-none " +
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /** Red pill, white text. One per view. */
        primary:
          "bg-red text-white hover:bg-red-deep active:bg-red-deep " +
          // Not opacity: a 50% red pill reads as red-tint, which the system uses for a selected chip.
          "disabled:bg-white-2 disabled:text-grey aria-disabled:bg-white-2 aria-disabled:text-grey",
        /** 1.5px black outline on white. */
        secondary:
          "border-outline border-black bg-transparent text-black hover:bg-black hover:text-white disabled:opacity-50 aria-disabled:opacity-50",
        /** 1.5px white outline, for use inside the one black section. */
        "secondary-on-dark":
          "border-outline border-white bg-transparent text-white hover:bg-white hover:text-black disabled:opacity-50 aria-disabled:opacity-50",
        /** Black ground. The WhatsApp button and any second dark action. */
        dark: "bg-black text-white hover:bg-black-2 disabled:opacity-50 aria-disabled:opacity-50",
        /** Inverted for the black section: white ground, black text. */
        light: "bg-white text-black hover:bg-white-2 disabled:opacity-50 aria-disabled:opacity-50",
        /** Red underlined text link. Never on a dark ground. */
        tertiary:
          "rounded-none px-0 text-red underline decoration-1 underline-offset-4 hover:text-red-deep hover:decoration-2 disabled:opacity-50 aria-disabled:opacity-50",
        /** Underlined text link for the black section, where red text is forbidden. */
        "tertiary-on-dark":
          "rounded-none px-0 text-white underline decoration-1 underline-offset-4 hover:decoration-2 disabled:opacity-50 aria-disabled:opacity-50",
      },
      size: {
        /** 48px on mobile, 44px from md, per the touch-target rule. */
        default: "h-12 px-6 text-body md:h-11",
        /** Still 44px tall so it clears the touch-target minimum. */
        sm: "h-11 px-5 text-small",
        /** Square icon button, 44px. */
        icon: "size-11 px-0",
        /** Fills the width of its column, used in the sheet and on mobile forms. */
        block: "h-12 w-full px-6 text-body",
        /** Text link. Vertical padding only, so it stays flush left and still clears 44px. */
        inline: "h-auto py-3 text-body",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

type ButtonVariants = VariantProps<typeof buttonClasses>;

interface CommonProps extends ButtonVariants {
  children: ReactNode;
  className?: string;
  /** Read by the analytics layer that lands in a later phase. */
  "data-event"?: string;
}

interface ButtonProps
  extends CommonProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> {}

export function Button({ children, className, variant, size, ...rest }: ButtonProps) {
  return (
    <button className={cn(buttonClasses({ variant, size }), className)} {...rest}>
      {children}
    </button>
  );
}

interface ButtonLinkProps
  extends CommonProps,
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children" | "href"> {
  href: string;
  /** Set for links that leave the site; adds rel and a new tab. */
  external?: boolean;
}

export function ButtonLink({
  children,
  className,
  variant,
  size,
  href,
  external = false,
  ...rest
}: ButtonLinkProps) {
  const classes = cn(buttonClasses({ variant, size }), className);

  if (external) {
    return (
      <a
        href={href}
        className={classes}
        target="_blank"
        rel="noopener noreferrer"
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} {...rest}>
      {children}
    </Link>
  );
}
