"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays, LayoutDashboard, QrCode, Receipt, Settings, Tag, Users, Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { hasOrgRole } from "@/lib/roles";
import type { OrgMemberRole } from "@/lib/types";

type Item = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  min: OrgMemberRole;
};

/**
 * Grouped rather than one flat list: nine undifferentiated links is a list to
 * read every time, three labelled groups of three is a place you learn.
 */
const GROUPS: { label: string; items: Item[] }[] = [
  {
    label: "Selling",
    items: [
      { href: "", label: "Overview", icon: LayoutDashboard, min: "scanner" },
      { href: "/events", label: "Events", icon: CalendarDays, min: "staff" },
      { href: "/orders", label: "Orders", icon: Receipt, min: "staff" },
      { href: "/promos", label: "Promo codes", icon: Tag, min: "staff" },
    ],
  },
  {
    label: "At the door",
    items: [
      { href: "/attendees", label: "Attendees", icon: Users, min: "scanner" },
      { href: "/scan", label: "Check-in", icon: QrCode, min: "scanner" },
    ],
  },
  {
    label: "Organization",
    items: [
      { href: "/team", label: "Team", icon: Users, min: "admin" },
      { href: "/settings/payments", label: "Payments", icon: Wallet, min: "admin" },
      { href: "/settings", label: "Settings", icon: Settings, min: "admin" },
    ],
  },
];

export function DashboardSidebar({ slug, role }: { slug: string; role: OrgMemberRole }) {
  const pathname = usePathname();
  const base = `/dashboard/${slug}`;

  return (
    <nav className="space-y-6" aria-label="Dashboard">
      {GROUPS.map((group) => {
        const items = group.items.filter((item) => hasOrgRole(role, item.min));
        if (items.length === 0) return null;

        return (
          <div key={group.label}>
            <p className="eyebrow px-2.5 pb-2">{group.label}</p>
            <div className="space-y-0.5">
              {items.map((item) => {
                const href = `${base}${item.href}`;
                // "Overview" must not stay lit on every child route, and
                // /settings must not light up when /settings/payments is.
                const active =
                  item.href === ""
                    ? pathname === base
                    : item.href === "/settings"
                      ? pathname === href
                      : pathname.startsWith(href);

                return (
                  <Link
                    key={item.href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-base font-medium transition-colors",
                      active
                        ? "bg-card text-ink shadow-e1"
                        : "text-ink-2 hover:bg-sunken hover:text-ink",
                    )}
                  >
                    <item.icon className={cn("size-[18px]", active ? "text-ink" : "text-ink-3")} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
