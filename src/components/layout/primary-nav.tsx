"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CENTER_NAV } from "./nav-links";

/**
 * The centred column of the app nav.
 *
 * Client-side because the current section is derived from the pathname; the
 * links themselves come from the shared definition rather than props, since
 * icon components are functions and cannot cross the server boundary.
 */
export function PrimaryNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex items-center gap-7", className)} aria-label="Primary">
      {CENTER_NAV.map((link) => {
        const current = link.match
          ? pathname === link.match || pathname.startsWith(`${link.match}/`)
          : false;

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 py-1.5 text-md font-medium transition-colors",
              current ? "text-ink" : "text-ink-2 hover:text-ink",
            )}
          >
            {link.icon && (
              <link.icon
                className={cn("size-[18px] shrink-0", current ? "text-ink" : "text-ink-3")}
              />
            )}
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
