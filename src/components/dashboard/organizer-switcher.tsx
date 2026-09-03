"use client";

import Link from "next/link";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import {
  Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger,
} from "@/components/ui/dropdown";
import { Avatar } from "@/components/ui/misc";
import type { MembershipWithOrganizer } from "@/lib/auth";
import type { Organizer } from "@/lib/types";

export function OrganizerSwitcher({
  current,
  memberships,
}: {
  current: Organizer;
  memberships: MembershipWithOrganizer[];
}) {
  return (
    <Dropdown>
      <DropdownTrigger className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-sunken focus-visible:outline-2 focus-visible:outline-accent-500">
        <Avatar src={current.logo_url} name={current.name} size="xs" />
        <span className="max-w-40 truncate text-[13.5px] font-medium text-ink">{current.name}</span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-ink-3" />
      </DropdownTrigger>

      <DropdownContent align="start" className="min-w-60">
        <DropdownLabel>Organizations</DropdownLabel>
        {memberships.map(({ organizer }) => (
          <DropdownItem key={organizer.id} asChild>
            <Link href={`/dashboard/${organizer.slug}`}>
              <Avatar src={organizer.logo_url} name={organizer.name} size="xs" />
              <span className="min-w-0 flex-1 truncate">{organizer.name}</span>
              {organizer.id === current.id && <Check className="!text-ink" />}
            </Link>
          </DropdownItem>
        ))}
        <DropdownSeparator />
        <DropdownItem asChild>
          <Link href="/dashboard/new"><Plus /> New organization</Link>
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}
