"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { DashboardSidebar } from "./sidebar";
import type { OrgMemberRole } from "@/lib/types";

/**
 * The sidebar on small screens. Closes on navigation — the pathname changing
 * is the signal that the tap took effect, so nothing has to be threaded
 * through every link.
 */
export function DashboardMobileNav({
  slug,
  role,
  name,
}: {
  slug: string;
  role: OrgMemberRole;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const pathname = usePathname();

  if (open && openedAt !== null && openedAt !== pathname) {
    setOpen(false);
    setOpenedAt(null);
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        aria-label="Open dashboard menu"
        aria-expanded={open}
        onClick={() => {
          setOpenedAt(pathname);
          setOpen(true);
        }}
      >
        <Menu />
      </Button>

      <span className="truncate text-md font-semibold text-ink lg:hidden">{name}</span>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-paper lg:hidden">
          <div className="flex h-(--size-nav) shrink-0 items-center justify-between border-b border-hairline px-5">
            <Logo />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            >
              <X />
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <DashboardSidebar slug={slug} role={role} />
          </div>
        </div>
      )}
    </>
  );
}
