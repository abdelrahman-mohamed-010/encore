import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireOrganizer } from "@/lib/auth";
import { TeamShell, type Member } from "@/components/dashboard/team-manager";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { organizer, role } = await requireOrganizer(slug, "admin");
  const supabase = await createClient();

  const membersPromise = supabase
    .from("organizer_members")
    .select("organizer_id, user_id, role, created_at, profile:profiles(id, full_name, email, avatar_url)")
    .eq("organizer_id", organizer.id)
    .order("created_at")
    .then(
      ({ data }) =>
        (data ?? []).map((m) => ({
          userId: m.user_id,
          role: m.role,
          fullName: m.profile?.full_name ?? null,
          email: m.profile?.email ?? "",
          avatarUrl: m.profile?.avatar_url ?? null,
        })) as Member[],
    );

  return <TeamShell organizerId={organizer.id} viewerRole={role} membersPromise={membersPromise} />;
}
