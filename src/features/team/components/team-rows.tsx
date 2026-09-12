import Link from "next/link";
import { Avatar } from "@/components/ui/misc";
import { PaginationRow, TableEmptyRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Users, UserPlus } from "lucide-react";
import { listTeamMembers, type Member } from "@/features/team/queries";
import { TeamRoleSelect, TeamRemoveButton } from "@/features/team/components/team-row-actions";

export type { Member };

export const TEAM_COLUMN_COUNT = 4;

export async function TeamRows({
  organizerId,
  organizerSlug,
  canManageOwners,
  query,
  roleFilter,
  page,
  pageSize,
}: {
  organizerId: string;
  organizerSlug: string;
  canManageOwners: boolean;
  query?: string;
  roleFilter?: string;
  page: number;
  pageSize: number;
}) {
  const {
    rows: members,
    total,
    totalPages,
  } = await listTeamMembers({ organizerId, query, roleFilter, page, pageSize });

  if (members.length === 0) {
    return (
      <TableEmptyRow
        icon={Users}
        columns={TEAM_COLUMN_COUNT}
        title="No team members found"
        description={
          total === 0
            ? "Invite collaborators to help manage events, scan tickets, or view sales."
            : "Try adjusting your search or role filter."
        }
        action={
          total === 0 ? (
            <Button asChild variant="solid" size="md">
              <Link href="?new=1">
                <UserPlus /> Add member
              </Link>
            </Button>
          ) : undefined
        }
      />
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
                organizerSlug={organizerSlug}
                userId={member.userId}
                email={member.email}
                role={member.role}
                canManageOwners={canManageOwners}
              />
            </td>

            <td className="px-5 py-3.5 text-right">
              {!(member.role === "owner" && !canManageOwners) && (
                <TeamRemoveButton organizerSlug={organizerSlug} userId={member.userId} email={member.email} />
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
