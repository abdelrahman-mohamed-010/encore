import { Search } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";import { Badge } from "@/components/ui/badge";
import { PaginationRow, TableEmptyRow } from "@/components/ui/table";
import { listUsers, type UserProfile } from "@/features/admin/queries";
import { formatDate } from "@/lib/format";
import { RoleSelect, BanToggleButton } from "@/features/admin/components/user-row-actions";

export type { UserProfile };

export const USERS_COLUMN_COUNT = 5;

export async function UserRows({
  query,
  page,
  pageSize,
}: {
  query?: string;
  page: number;
  pageSize: number;
}) {
  const { rows: profiles, total, totalPages } = await listUsers({ query, page, pageSize });

  if (profiles.length === 0) {
    return (
      <TableEmptyRow
        icon={Search}
        columns={USERS_COLUMN_COUNT}
        title="No users found"
        description="Try a different search term."
      />
    );
  }

  return (
    <>
      <tbody>
        {profiles.map((profile) => (
          <tr key={profile.id} className="border-b border-hairline-soft last:border-b-0 hover:bg-sunken">
            <td className="px-5 py-3.5">
              <div className="flex items-center gap-3">
                <Avatar src={profile.avatar_url} name={profile.full_name ?? profile.email} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-ink">{profile.full_name ?? "—"}</p>
                  <p className="truncate text-xs text-ink-3">{profile.email}</p>
                </div>
              </div>
            </td>
            <td className="whitespace-nowrap px-5 py-3.5 text-ink-3">
              {formatDate(profile.created_at, "medium")}
            </td>
            <td className="px-5 py-3.5">
              <RoleSelect id={profile.id} email={profile.email} role={profile.role} />
            </td>
            <td className="px-5 py-3.5">
              <Badge tone={profile.is_banned ? "critical" : "positive"} size="xs">
                {profile.is_banned ? "Banned" : "Active"}
              </Badge>
            </td>
            <td className="px-5 py-3.5 text-right">
              <BanToggleButton id={profile.id} isBanned={profile.is_banned} />
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={USERS_COLUMN_COUNT} className="p-0">
            <PaginationRow page={page} totalPages={totalPages} total={total} pageSize={pageSize} />
          </td>
        </tr>
      </tfoot>
    </>
  );
}
