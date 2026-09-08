import { Avatar } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { PaginationRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { RoleSelect, BanToggleButton } from "@/components/admin/user-row-actions";
import type { Profile } from "@/lib/types";

export type UserProfile = Pick<
  Profile,
  "id" | "email" | "full_name" | "avatar_url" | "role" | "is_banned" | "created_at"
>;

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
  const supabase = await createClient();

  let dbQuery = supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, role, is_banned, created_at", { count: "exact" });

  if (query?.trim()) {
    const term = `%${query.trim()}%`;
    dbQuery = dbQuery.or(`email.ilike.${term},full_name.ilike.${term}`);
  }

  const from = (page - 1) * pageSize;
  const { data, count } = await dbQuery
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  const profiles = (data ?? []) as UserProfile[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (profiles.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={USERS_COLUMN_COUNT} className="px-5 py-16 text-center">
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
