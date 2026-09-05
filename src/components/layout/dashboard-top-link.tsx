"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function DashboardTopLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const pathname = usePathname();

  // Hide the link when already on any dashboard route
  if (pathname.startsWith("/dashboard")) {
    return null;
  }

  return (
    <Link
      href={href}
      className="hidden text-md font-medium text-ink transition-colors hover:text-ink-2 sm:inline"
    >
      {label}
    </Link>
  );
}
