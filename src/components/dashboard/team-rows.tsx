import { Avatar } from "@/components/ui/misc";
import { PaginationRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TeamRoleSelect, TeamRemoveButton } from "@/components/dashboard/team-row-actions";
import type { OrgMemberRole } from "@/lib/types";

export type Member = {
  userId: string;
  role: OrgMemberRole;
  fullName: string | null;
  email: string;
  avatarUrl: string | null;
};

export const TEAM_COLUMN_COUNT = 4;

export async function TeamRows({
  organizerId,
  canManageOwners,
  query,
  roleFilter,
  page,
  pageSize,
}: {
  organizerId: string;
  canManageOwners: boolean;
  query?: string;
  roleFilter?: string;
  page: number;
  pageSize: number;
}) {
  const supabase = await createClient();

  let dbQuery = supabase
    .from("organizer_members")
    .select("organizer_id, user_id, role, created_at, profile:profiles(id, full_name, email, avatar_url)")
    .eq("organizer_id", organizerId);

  if (roleFilter && roleFilter !== "all") dbQuery = dbQuery.eq("role", roleFilter as OrgMemberRole);

  // A team is small (an org's staff), and the search spans a joined
  // relationship Supabase can't `.ilike()` directly — so this table fetches
  // its (role-filtered) rows in one shot and paginates server-side in code
  // rather than via `.range()`, which keeps the total/page count correct
  // once the name/email search narrows the result set.
  const { data } = await dbQuery.order("created_at");

  let members: Member[] = (data ?? []).map((m) => ({
    userId: m.user_id,
    role: m.role,
    fullName: m.profile?.full_name ?? null,
    email: m.profile?.email ?? "",
    avatarUrl: m.profile?.avatar_url ?? null,
  }));

  if (query?.trim()) {
    const q = query.toLowerCase().trim();
    members = members.filter(
      (m) => (m.fullName && m.fullName.toLowerCase().includes(q)) || m.email.toLowerCase().includes(q),
    );
  }

  const total = members.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize;
  members = members.slice(from, from + pageSize);

  if (members.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={TEAM_COLUMN_COUNT} className="px-5 py-16 text-center">
            <p className="text-sm font-medium text-ink">No team members found</p>
            <p className="mt-1 text-sm text-ink-3">
              {total === 0
                ? "Invite collaborators to help manage events, scan tickets, or view sales."
                : "Try adjusting your search or role filter."}
            </p>
            {total === 0 && (
              <Button variant="solid" size="md" className="mt-4" disabled>
                <UserPlus /> Add member
              </Button>
            )}
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <>
      <tbody>
        {members.map((member) => (
          <tr
            key={member.userId}
            className="border-b border-hairline-soft transition-colors hover:bg-sunken/60 last:border-b-0"
          >
            <td className="px-5 py-3.5">
              <div className="flex items-center gap-3">
                <Avatar src={member.avatarUrl} name={member.fullName ?? member.email} size="md" />
                <span className="font-medium text-ink">{member.fullName ?? "Team member"}</span>
              </div>
            </td>

            <td className="whitespace-nowrap px-5 py-3.5 text-ink-2">{member.email}</td>

            <td className="px-5 py-3.5">
              <TeamRoleSelect
                organizerId={organizerId}
                userId={member.userId}
                email={member.email}
                role={member.role}
                canManageOwners={canManageOwners}
              />
            </td>

            <td className="px-5 py-3.5 text-right">
              {!(member.role === "owner" && !canManageOwners) && (
                <TeamRemoveButton organizerId={organizerId} userId={member.userId} email={member.email} />
              )}
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={TEAM_COLUMN_COUNT} className="p-0">
            <PaginationRow page={page} totalPages={totalPages} total={total} pageSize={pageSize} />
          </td>
        </tr>
      </tfoot>
    </>
  );
}
