"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays, LayoutDashboard, QrCode, Receipt, Settings, Tag, Users, Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrgMemberRole } from "@/lib/types";

const RANK: Record<OrgMemberRole, number> = { scanner: 0, staff: 1, admin: 2, owner: 3 };

const NAV: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; min: OrgMemberRole }[] = [
  { href: "", label: "Overview", icon: LayoutDashboard, min: "scanner" },
  { href: "/events", label: "Events", icon: CalendarDays, min: "staff" },
  { href: "/orders", label: "Orders", icon: Receipt, min: "staff" },
  { href: "/attendees", label: "Attendees", icon: Users, min: "scanner" },
  { href: "/scan", label: "Check-in", icon: QrCode, min: "scanner" },
  { href: "/promos", label: "Promo codes", icon: Tag, min: "staff" },
  { href: "/team", label: "Team", icon: Users, min: "admin" },
  { href: "/settings/payments", label: "Payments", icon: Wallet, min: "admin" },
  { href: "/settings", label: "Settings", icon: Settings, min: "admin" },
];

export function DashboardSidebar({ slug, role }: { slug: string; role: OrgMemberRole }) {
  const pathname = usePathname();
  const base = `/dashboard/${slug}`;

  return (
    <nav className="space-y-0.5" aria-label="Dashboard">
      {NAV.filter((item) => RANK[role] >= RANK[item.min]).map((item) => {
        const href = `${base}${item.href}`;
        // "Overview" must not stay lit on every child route, and /settings must
        // not light up when /settings/payments is active.
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
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
              active ? "bg-sunken text-ink" : "text-ink-3 hover:bg-sunken hover:text-ink-2",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
