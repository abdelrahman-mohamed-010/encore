"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Receipt, Settings, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

export const ACCOUNT_TABS = [
  { href: "/account/tickets", label: "Tickets", icon: Ticket },
  { href: "/account/orders", label: "Orders", icon: Receipt },
  { href: "/account/saved", label: "Saved", icon: Heart },
  { href: "/account/settings", label: "Settings", icon: Settings },
];

export function AccountTabs({ className }: { className?: string }) {
  return <TabNav items={ACCOUNT_TABS} className={className} />;
}

/**
 * The underlined tab strip that sits on a page header's closing rule.
 *
 * Active state comes from the pathname rather than a prop, so a layout can
 * render it once above `children` without every page having to say which tab
 * it is.
 */
export function TabNav({
  items,
  className,
}: {
  items: {
    href: string;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    /** Path prefix that marks this tab current. Defaults to `href`. */
    match?: string;
  }[];
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav
      className={cn("-mb-px flex gap-6 overflow-x-auto no-scrollbar", className)}
      aria-label="Sections"
    >
      {items.map((item) => {
        const base = item.match ?? item.href;
        const active = pathname === base || pathname.startsWith(`${base}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 pb-2.5 text-md font-medium transition-colors",
              active
                ? "border-ink text-ink"
                : "border-transparent text-ink-2 hover:text-ink",
            )}
          >
            {item.icon && (
              <item.icon className={cn("size-[18px]", active ? "text-ink" : "text-ink-3")} />
            )}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
