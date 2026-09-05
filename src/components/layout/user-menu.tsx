"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2, Heart, LogOut, Plus, Settings, ShieldCheck, Ticket, Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/misc";
import {
  Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger,
} from "@/components/ui/dropdown";
import { NewOrganizationModal } from "@/components/dashboard/new-organization-modal";
import type { MembershipWithOrganizer } from "@/lib/auth";
import type { Profile } from "@/lib/types";

export function UserMenu({
  profile,
  memberships,
}: {
  profile: Profile;
  memberships: MembershipWithOrganizer[];
}) {
  const router = useRouter();
  const [newOrgOpen, setNewOrgOpen] = React.useState(false);

  async function signOut() {
    const { error } = await createClient().auth.signOut();
    if (error) {
      toast.error("Could not sign out", { description: error.message });
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <Dropdown>
      <DropdownTrigger className="flex items-center rounded-full transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
        <Avatar src={profile.avatar_url} name={profile.full_name ?? profile.email} size="md" />
      </DropdownTrigger>

      <DropdownContent className="min-w-60">
        <div className="flex items-center gap-2.5 px-2.5 py-2">
          <Avatar src={profile.avatar_url} name={profile.full_name ?? profile.email} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">
              {profile.full_name ?? "Your account"}
            </p>
            <p className="truncate text-xs text-ink-2">{profile.email}</p>
          </div>
        </div>
        <DropdownSeparator />

        <DropdownItem asChild>
          <Link href="/account/tickets"><Ticket /> My tickets</Link>
        </DropdownItem>
        <DropdownItem asChild>
          <Link href="/account/orders"><Receipt /> Orders</Link>
        </DropdownItem>
        <DropdownItem asChild>
          <Link href="/account/saved"><Heart /> Saved</Link>
        </DropdownItem>
        <DropdownItem asChild>
          <Link href="/account/settings"><Settings /> Settings</Link>
        </DropdownItem>

        {memberships.length > 0 && (
          <>
            <DropdownSeparator />
            <DropdownLabel>Organizations</DropdownLabel>
            {memberships.map(({ organizer, role }) => (
              <DropdownItem key={organizer.id} asChild>
                <Link href={`/dashboard/${organizer.slug}`}>
                  <Building2 />
                  <span className="min-w-0 flex-1 truncate">{organizer.name}</span>
                  <span className="shrink-0 text-2xs font-semibold uppercase tracking-[0.06em] text-ink-3">
                    {role}
                  </span>
                </Link>
              </DropdownItem>
            ))}
          </>
        )}

        <DropdownSeparator />
        <DropdownItem onSelect={(e) => {
          e.preventDefault();
          setNewOrgOpen(true);
        }}>
          <Plus /> {memberships.length ? "New organization" : "Start selling tickets"}
        </DropdownItem>
        {profile.role === "admin" && (
          <DropdownItem asChild>
            <Link href="/admin"><ShieldCheck /> Admin console</Link>
          </DropdownItem>
        )}
        <DropdownSeparator />
        <DropdownItem tone="danger" onSelect={signOut}>
          <LogOut /> Sign out
        </DropdownItem>
      </DropdownContent>
    </Dropdown>

    <NewOrganizationModal open={newOrgOpen} onOpenChange={setNewOrgOpen} />
    </>
  );
}
