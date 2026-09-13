import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { hasOrgRole } from "@/lib/roles";
import { fail } from "@/lib/api";
import type { Database } from "@/lib/supabase/database.types";
import type { OrgMemberRole } from "@/lib/types";

type Db = SupabaseClient<Database>;
type Guard<T> = { data: T; response?: never } | { data?: never; response: Response };

/** The route-handler counterpart of requireUser, which redirects and so cannot be reused here. */
export async function requireUserJson(): Promise<Guard<{ supabase: Db; user: User }>> {
  const supabase = (await createClient()) as Db;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { response: fail("You must be signed in.", 401) };
  return { data: { supabase, user } };
}

export async function requireOrgRoleJson(
  supabase: Db,
  organizerId: string,
  userId: string,
  minimum: OrgMemberRole,
  message: string,
): Promise<Guard<OrgMemberRole>> {
  const { data: membership } = await supabase
    .from("organizer_members")
    .select("role")
    .eq("organizer_id", organizerId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership || !hasOrgRole(membership.role, minimum)) {
    return { response: fail(message, 403) };
  }
  return { data: membership.role };
}
