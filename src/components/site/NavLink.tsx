"use client";

// Client: needs the current pathname to mark the active item with aria-current.

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export function NavLink({ href, children, className }: NavLinkProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex items-center py-2 text-body font-medium transition-colors duration-200",
        active ? "text-red" : "text-black hover:text-red",
        className,
      )}
    >
      <span
        className={cn(
          "border-b-2 pb-0.5",
          active ? "border-red" : "border-transparent",
        )}
      >
        {children}
      </span>
    </Link>
  );
}
