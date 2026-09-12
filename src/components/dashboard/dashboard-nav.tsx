"use client";

import {
  CalendarDays,
  LayoutDashboard,
  Receipt,
  Settings,
  Tag,
  Users,
} from "lucide-react";
import { TabNav } from "@/components/ui/tab-nav";
import { hasOrgRole } from "@/lib/roles";
import type { OrgMemberRole } from "@/lib/types";

export function DashboardTabs({
  slug,
  role,
}: {
  slug: string;
  role: OrgMemberRole;
}) {
  const base = `/dashboard/${slug}`;

  const tabs = [
    {
      href: base,
      label: "Overview",
      icon: LayoutDashboard,
      exact: true,
      min: "scanner" as OrgMemberRole,
    },
    {
      href: `${base}/events`,
      label: "Events",
      icon: CalendarDays,
      min: "staff" as OrgMemberRole,
    },
    {
      href: `${base}/orders`,
      label: "Orders",
      icon: Receipt,
      min: "staff" as OrgMemberRole,
    },
    {
      href: `${base}/attendees`,
      label: "Attendees",
      icon: Users,
      min: "scanner" as OrgMemberRole,
    },
    {
      href: `${base}/promos`,
      label: "Promo codes",
      icon: Tag,
      min: "staff" as OrgMemberRole,
    },
    {
      href: `${base}/team`,
      label: "Team",
      icon: Users,
      min: "admin" as OrgMemberRole,
    },
    {
      href: `${base}/settings`,
      label: "Settings",
      icon: Settings,
      min: "admin" as OrgMemberRole,
    },
  ];

  const visibleTabs = tabs.filter((t) => hasOrgRole(role, t.min));

  return <TabNav items={visibleTabs} />;
}
