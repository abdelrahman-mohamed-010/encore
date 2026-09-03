import { CalendarDays, Compass, LayoutGrid, Sparkles } from "lucide-react";

export type NavLink = {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
};

export const PRIMARY_NAV: NavLink[] = [
  { href: "/events", label: "Browse", icon: Compass },
  { href: "/events?sort=soonest", label: "This week", icon: CalendarDays },
  { href: "/categories", label: "Categories", icon: LayoutGrid },
  { href: "/organizers", label: "Organizers", icon: Sparkles },
];
