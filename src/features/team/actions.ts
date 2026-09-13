"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionError, authActionClient, requireOrgAccess } from "@/lib/safe-action";
import { teamMemberSchema } from "@/lib/validation";
import { uuid } from "@/lib/validation/common";

const slug = z.object({ organizerSlug: z.string().min(1) });
const orgRole = z.enum(["owner", "admin", "staff", "scanner"]);

export const addTeamMember = authActionClient
  .inputSchema(teamMemberSchema.extend({ organizerSlug: z.string().min(1) }))
  .action(async ({ parsedInput, ctx }) => {
    const { organizer } = await requireOrgAccess(parsedInput.organizerSlug, "admin");

    const { data: profile } = await ctx.supabase
      .from("profiles")
      .select("id")
      .ilike("email", parsedInput.email)
      .maybeSingle();

    if (!profile) {
      actionError("Nobody with that email has an Encore account yet. Ask them to sign up first.");
    }

    const { error } = await ctx.supabase
      .from("organizer_members")
      .insert({ organizer_id: organizer.id, user_id: profile.id, role: parsedInput.role });

    if (error) {
      actionError(error.code === "23505" ? "That person is already on the team." : error.message);
    }

    revalidatePath(`/dashboard/${organizer.slug}/team`);
  });

export const setTeamMemberRole = authActionClient
  .inputSchema(slug.extend({ userId: uuid, role: orgRole }))
  .action(async ({ parsedInput, ctx }) => {
    const { organizer, role: callerRole } = await requireOrgAccess(
      parsedInput.organizerSlug,
      "admin",
    );

    if (parsedInput.role === "owner" && callerRole !== "owner") {
      actionError("Only an owner can grant ownership.");
    }

    const { error } = await ctx.supabase
      .from("organizer_members")
      .update({ role: parsedInput.role })
      .eq("organizer_id", organizer.id)
      .eq("user_id", parsedInput.userId);

    if (error) actionError(error.message);
    revalidatePath(`/dashboard/${organizer.slug}/team`);
  });

export const removeTeamMember = authActionClient
  .inputSchema(slug.extend({ userId: uuid }))
  .action(async ({ parsedInput, ctx }) => {
    const { organizer } = await requireOrgAccess(parsedInput.organizerSlug, "admin");

    const { error } = await ctx.supabase
      .from("organizer_members")
      .delete()
      .eq("organizer_id", organizer.id)
      .eq("user_id", parsedInput.userId);

    if (error) actionError(error.message);
    revalidatePath(`/dashboard/${organizer.slug}/team`);
  });
