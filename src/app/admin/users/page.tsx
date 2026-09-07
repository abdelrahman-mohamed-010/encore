import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SectionHeader } from "@/components/ui/surface";
import { UserTable } from "@/components/admin/user-table";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, role, is_banned, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (q?.trim()) {
    const term = `%${q.trim()}%`;
    query = query.or(`email.ilike.${term},full_name.ilike.${term}`);
  }

  const { data: profiles } = await query;

  return (
    <div className="space-y-6">
      <SectionHeader level={1} title="Users" description="Everyone with a Tazkarti account." />
      <UserTable profiles={profiles ?? []} initialQuery={q ?? ""} />
    </div>
  );
}
