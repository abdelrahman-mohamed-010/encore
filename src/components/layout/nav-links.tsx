import { CalendarDays, Compass, LayoutGrid, Users } from "lucide-react";

export type NavLink = {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  /**
   * Path prefix that marks this link as current. Kept separate from `href`
   * because a link may carry query state (`?sort=soonest`) that must not be
   * part of the comparison.
   */
  match?: string;
};

export const PRIMARY_NAV: NavLink[] = [
  { href: "/events", label: "Discover", icon: Compass, match: "/events" },
  { href: "/events?sort=soonest", label: "This week", icon: CalendarDays },
  { href: "/categories", label: "Categories", icon: LayoutGrid, match: "/categories" },
  { href: "/organizers", label: "Organizers", icon: Users, match: "/organizers" },
];

/** The three shown in the centre of the desktop nav. */
export const CENTER_NAV: NavLink[] = [
  PRIMARY_NAV[0],
  PRIMARY_NAV[2],
  PRIMARY_NAV[3],
];
