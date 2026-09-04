"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { PRIMARY_NAV } from "./nav-links";

/**
 * Imports the nav definition directly instead of receiving it as a prop: icon
 * components are functions and cannot be serialised across the server/client
 * boundary.
 */
export function MobileNav({ action }: { action?: React.ReactNode }) {
  const links = PRIMARY_NAV;
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 bg-paper md:hidden">
          <div className="flex h-(--size-nav) items-center justify-between border-b border-hairline px-5">
            <Logo />
            <Button variant="ghost" size="icon-sm" aria-label="Close menu" onClick={() => setOpen(false)}>
              <X />
            </Button>
          </div>
          <nav className="flex flex-col p-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3.5 rounded-lg px-3 py-3.5 text-lg font-medium text-ink transition-colors hover:bg-sunken"
              >
                {link.icon && <link.icon className="size-5 text-ink-3" />}
                {link.label}
              </Link>
            ))}
          </nav>
          {action && <div className="border-t border-hairline p-4">{action}</div>}
        </div>
      )}
    </>
  );
}
