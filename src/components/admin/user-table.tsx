"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/surface";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select";
import { Avatar } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { TablePagination, TableRowsSkeleton, useTablePagination } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import type { Profile, UserRole } from "@/lib/types";

export type UserProfile = Pick<
  Profile,
  "id" | "email" | "full_name" | "avatar_url" | "role" | "is_banned" | "created_at"
>;

const COLUMN_COUNT = 5;

/** Static shell: the search box. Never a skeleton. */
export function UserTableShell({
  profilesPromise,
  initialQuery,
}: {
  profilesPromise: PromiseLike<UserProfile[]>;
  initialQuery: string;
}) {
  const [query, setQuery] = useState(initialQuery);

  return (
    <div className="space-y-4">
      <form className="relative max-w-sm" onSubmit={(e) => e.preventDefault()}>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email"
          className="pl-9"
          aria-label="Search users"
        />
      </form>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead>
            <tr className="border-b border-hairline text-2xs uppercase tracking-[0.06em] text-ink-3">
              <th scope="col" className="px-4 py-3 font-semibold">User</th>
              <th scope="col" className="px-4 py-3 font-semibold">Joined</th>
              <th scope="col" className="px-4 py-3 font-semibold">Role</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3" />
            </tr>
          </thead>
          <React.Suspense fallback={<TableRowsSkeleton rows={6} columns={COLUMN_COUNT} />}>
            <UserRows profilesPromise={profilesPromise} query={query} />
          </React.Suspense>
        </table>
      </Card>
    </div>
  );
}

function UserRows({
  profilesPromise,
  query,
}: {
  profilesPromise: PromiseLike<UserProfile[]>;
  query: string;
}) {
  const router = useRouter();
  const profiles = React.use(profilesPromise);
  const [, startTransition] = useTransition();

  const filteredProfiles = React.useMemo(() => {
    if (!query.trim()) return profiles;
    const q = query.toLowerCase().trim();
    return profiles.filter(
      (p) =>
        (p.full_name && p.full_name.toLowerCase().includes(q)) ||
        p.email.toLowerCase().includes(q),
    );
  }, [profiles, query]);

  const {
    paginatedItems,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    setPage,
    setPageSize,
  } = useTablePagination(filteredProfiles, 10);

  function update(id: string, patch: { role?: UserRole; is_banned?: boolean }, message: string) {
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("profiles").update(patch).eq("id", id);
      if (error) {
        toast.error("Could not update the user", { description: error.message });
        return;
      }
      toast.success(message);
      router.refresh();
    });
  }

  if (filteredProfiles.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={COLUMN_COUNT} className="px-4 py-16 text-center">
            <p className="text-sm font-medium text-ink">No users found</p>
            <p className="mt-1 text-sm text-ink-3">Try a different search term.</p>
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <>
      <tbody>
        {paginatedItems.map((profile) => (
          <tr key={profile.id} className="border-b border-hairline-soft last:border-b-0 hover:bg-sunken">
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <Avatar src={profile.avatar_url} name={profile.full_name ?? profile.email} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-ink">{profile.full_name ?? "—"}</p>
                  <p className="truncate text-xs text-ink-3">{profile.email}</p>
                </div>
              </div>
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-ink-3">
              {formatDate(profile.created_at, "medium")}
            </td>
            <td className="px-4 py-3">
              <SelectField
                value={profile.role}
                aria-label={`Role for ${profile.email}`}
                size="sm"
                className="w-32"
                onChange={(value) =>
                  update(profile.id, { role: value as UserRole }, "Role updated")
                }
                options={[
                  { value: "attendee", label: "Attendee" },
                  { value: "organizer", label: "Organizer" },
                  { value: "admin", label: "Admin" },
                ]}
              />
            </td>
            <td className="px-4 py-3">
              <Badge tone={profile.is_banned ? "critical" : "positive"} size="xs">
                {profile.is_banned ? "Banned" : "Active"}
              </Badge>
            </td>
            <td className="px-4 py-3 text-right">
              <Button
                variant="ghost"
                size="xs"
                onClick={() =>
                  update(
                    profile.id,
                    { is_banned: !profile.is_banned },
                    profile.is_banned ? "User unbanned" : "User banned",
                  )
                }
              >
                {profile.is_banned ? "Unban" : "Ban"}
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={COLUMN_COUNT} className="p-0">
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </td>
        </tr>
      </tfoot>
    </>
  );
}
