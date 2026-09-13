import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasOrgRole } from "@/lib/roles";
import type { OrgMemberRole, Organizer, Profile } from "@/lib/types";

export { hasOrgRole };

/** The signed-in auth user, or null. Memoised per request. */
export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** The signed-in user's profile row, or null. */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return data ?? null;
});

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/auth/login");
  return user;
}

export async function requireProfile() {
  const profile = await getProfile();
  if (!profile) redirect("/auth/login");
  return profile;
}

export async function requireAdmin() {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect("/");
  return profile;
}

export type MembershipWithOrganizer = {
  role: OrgMemberRole;
  organizer: Organizer;
};

/** Every tenant the signed-in user belongs to, with their role in each. */
export const getMyOrganizers = cache(async (): Promise<MembershipWithOrganizer[]> => {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("organizer_members")
    .select("role, organizer:organizers(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  return (data ?? [])
    .filter((row): row is typeof row & { organizer: Organizer } => Boolean(row.organizer))
    .map((row) => ({ role: row.role, organizer: row.organizer }));
});

/**
 * Resolve the tenant addressed by a dashboard URL and assert the caller has at
 * least `minimum` rights in it. Redirects rather than throwing so the dashboard
 * never renders a half-authorised page.
 */
export async function requireOrganizer(slug: string, minimum: OrgMemberRole = "scanner") {
  await requireUser();
  const memberships = await getMyOrganizers();
  const membership = memberships.find((m) => m.organizer.slug === slug);

  if (!membership) redirect("/dashboard");
  if (!hasOrgRole(membership.role, minimum)) redirect(`/dashboard/${slug}`);

  return membership;
}
