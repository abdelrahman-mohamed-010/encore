"use client";

import { CalendarCheck, LayoutGrid, Users } from "lucide-react";
import { TabNav } from "@/components/ui/tab-nav";

export const ADMIN_TABS = [
  { href: "/admin/events", label: "Events", icon: CalendarCheck },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/categories", label: "Categories", icon: LayoutGrid },
];

export function AdminTabs({ className }: { className?: string }) {
  return <TabNav items={ADMIN_TABS} className={className} />;
}

/** Backwards-compatible export */
export const AdminNav = AdminTabs;
