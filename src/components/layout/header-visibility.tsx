"use client";

import { usePathname } from "next/navigation";

/** Hides the site topbar on routes that want a full-bleed, immersive view — currently just the organizer public page. */
const HIDE_ON = [/^\/organizers\/[^/]+$/];

export function HeaderVisibility({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (HIDE_ON.some((pattern) => pattern.test(pathname))) return null;
  return <>{children}</>;
}
