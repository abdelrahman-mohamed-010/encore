import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Paged } from "@/features/dashboard/queries";
import type { OrgMemberRole } from "@/lib/types";

export type Member = {
  userId: string;
  role: OrgMemberRole;
  fullName: string | null;
  email: string;
  avatarUrl: string | null;
};

/**
 * A team is small, and the name/email search spans a joined relationship
 * Supabase cannot `.ilike()` directly, so this pages in code rather than via
 * `.range()` — which keeps total and page count correct once search narrows.
 */
export async function listTeamMembers({
  organizerId,
  query,
  roleFilter,
  page,
  pageSize,
}: {
  organizerId: string;
  query?: string;
  roleFilter?: string;
  page: number;
  pageSize: number;
}): Promise<Paged<Member>> {
  const supabase = await createClient();

  let dbQuery = supabase
    .from("organizer_members")
    .select(
      "organizer_id, user_id, role, created_at, profile:profiles(id, full_name, email, avatar_url)",
    )
    .eq("organizer_id", organizerId);

  if (roleFilter && roleFilter !== "all") {
    dbQuery = dbQuery.eq("role", roleFilter as OrgMemberRole);
  }

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
      (m) =>
        (m.fullName && m.fullName.toLowerCase().includes(q)) || m.email.toLowerCase().includes(q),
    );
  }

  const total = members.length;
  const from = (page - 1) * pageSize;

  return {
    rows: members.slice(from, from + pageSize),
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
