"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2, ChevronDown, Heart, LogOut, Plus, Settings, ShieldCheck, Ticket, Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/misc";
import {
  Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger,
} from "@/components/ui/dropdown";
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
    <Dropdown>
      <DropdownTrigger className="flex items-center gap-1 rounded-full p-0.5 transition-colors hover:bg-sunken focus-visible:outline-2 focus-visible:outline-accent-500">
        <Avatar src={profile.avatar_url} name={profile.full_name ?? profile.email} size="sm" />
        <ChevronDown className="mr-0.5 size-3.5 text-ink-3" />
      </DropdownTrigger>

      <DropdownContent className="min-w-60">
        <div className="flex items-center gap-3 px-2.5 py-2.5">
          <Avatar src={profile.avatar_url} name={profile.full_name ?? profile.email} size="md" />
          <div className="min-w-0">
            <p className="truncate text-[13.5px] font-medium text-ink">
              {profile.full_name ?? "Your account"}
            </p>
            <p className="truncate text-[12px] text-ink-3">{profile.email}</p>
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
                  <span className="shrink-0 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-ink-3">
                    {role}
                  </span>
                </Link>
              </DropdownItem>
            ))}
          </>
        )}

        <DropdownSeparator />
        <DropdownItem asChild>
          <Link href="/dashboard/new"><Plus /> {memberships.length ? "New organization" : "Start selling tickets"}</Link>
        </DropdownItem>
        {profile.role === "admin" && (
          <DropdownItem asChild>
            <Link href="/admin"><ShieldCheck /> Admin console</Link>
          </DropdownItem>
        )}
        <DropdownSeparator />
        <DropdownItem onSelect={signOut} className="text-critical focus:text-critical [&_svg]:text-critical">
          <LogOut /> Sign out
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}
