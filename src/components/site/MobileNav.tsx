"use client";

// Client: the sheet opens on tap, traps focus while open and restores it on close.

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button, ButtonLink } from "@/components/site/Button";
import { CallButton } from "@/components/site/CallButton";
import { TbcValue } from "@/components/site/TbcPill";
import { primaryNav } from "@/lib/nav";
import type { SiteSettings } from "@/lib/content";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  phone: string;
  address: SiteSettings["address"];
  hours: string | null;
}

export function MobileNav({ phone, address, hours }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="secondary" size="icon" aria-label="Open the menu">
            <Menu className="size-5" aria-hidden="true" />
          </Button>
        }
      />
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full max-w-none gap-0 bg-white p-0 sm:max-w-sm data-[side=right]:sm:max-w-sm"
      >
        <div className="flex items-center justify-between border-b border-white-2 px-5 py-4">
          <SheetTitle className="type-label text-grey">Menu</SheetTitle>
          <SheetClose
            render={
              <Button variant="secondary" size="icon" aria-label="Close the menu">
                <X className="size-5" aria-hidden="true" />
              </Button>
            }
          />
        </div>

        <nav aria-label="Mobile" className="flex-1 overflow-y-auto">
          <ul>
            {primaryNav.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href} className="border-b border-white-2">
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-12 items-center px-5 text-body font-medium",
                      active ? "text-red" : "text-black",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex flex-col gap-3 border-t border-white-2 px-5 py-5">
          <ButtonLink
            href="/enquire"
            variant="primary"
            size="block"
            onClick={() => setOpen(false)}
            data-event="enquire_click"
          >
            Enquire
          </ButtonLink>
          <CallButton phone={phone} size="block" variant="secondary" />
        </div>

        <div className="border-t border-white-2 px-5 py-5 type-small text-grey">
          <p className="font-medium text-black">Bengaluru campus</p>
          <address className="mt-1 not-italic">
            {address.line1}
            <br />
            {address.line2}
            <br />
            {address.city} {address.postalCode}
          </address>
          {/* TODO(client): opening hours. `hours` is null until the academy confirms them. */}
          <p className="mt-3 flex items-center gap-2">
            Hours: <TbcValue value={hours} className="text-black" />
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
