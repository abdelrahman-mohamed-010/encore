import "server-only";
import { createSafeActionClient } from "next-safe-action";
import { createClient } from "@/lib/supabase/server";
import { getMyOrganizers, getUser } from "@/lib/auth";
import { hasOrgRole } from "@/lib/roles";
import type { OrgMemberRole } from "@/lib/types";

class ActionError extends Error {}

export function actionError(message: string): never {
  throw new ActionError(message);
}

export const actionClient = createSafeActionClient({
  handleServerError(error) {
    if (error instanceof ActionError) return error.message;
    console.error("Server action failed:", error);
    return "Something went wrong. Please try again.";
  },
});

export const authActionClient = actionClient.use(async ({ next }) => {
  const user = await getUser();
  if (!user) actionError("You must be signed in.");

  const supabase = await createClient();
  return next({ ctx: { user, supabase } });
});

/** Asserts the caller holds at least `minimum` in `slug`, and hands back the tenant. */
export async function requireOrgAccess(slug: string, minimum: OrgMemberRole) {
  const membership = (await getMyOrganizers()).find((m) => m.organizer.slug === slug);
  if (!membership) actionError("You do not have access to this organizer.");
  if (!hasOrgRole(membership.role, minimum)) {
    actionError("You do not have permission to do that.");
  }
  return membership;
}
