"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionError, authActionClient, requireOrgAccess } from "@/lib/safe-action";
import { organizerSchema } from "@/lib/validation";

export const createOrganizer = authActionClient
  .inputSchema(organizerSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { data, error } = await ctx.supabase
      .from("organizers")
      .insert({
        owner_id: ctx.user.id,
        name: parsedInput.name,
        slug: parsedInput.slug,
        description: parsedInput.description || null,
        support_email: parsedInput.supportEmail || null,
      })
      .select("slug")
      .single();

    if (error) {
      actionError(
        error.code === "23505"
          ? "That web address is already taken. Try another."
          : error.message,
      );
    }

    revalidatePath("/dashboard");
    return { slug: data.slug };
  });

export const updateOrganizer = authActionClient
  .inputSchema(organizerSchema.extend({ organizerSlug: z.string().min(1) }))
  .action(async ({ parsedInput, ctx }) => {
    const { organizer } = await requireOrgAccess(parsedInput.organizerSlug, "admin");

    const { error } = await ctx.supabase
      .from("organizers")
      .update({
        name: parsedInput.name,
        description: parsedInput.description || null,
        logo_url: parsedInput.logoUrl || null,
        website: parsedInput.website || null,
        support_email: parsedInput.supportEmail || null,
      })
      .eq("id", organizer.id);

    if (error) actionError(error.message);
    revalidatePath(`/dashboard/${organizer.slug}/settings`);
  });

export const disconnectStripe = authActionClient
  .inputSchema(z.object({ organizerSlug: z.string().min(1) }))
  .action(async ({ parsedInput, ctx }) => {
    const { organizer } = await requireOrgAccess(parsedInput.organizerSlug, "owner");

    const { error } = await ctx.supabase
      .from("payment_accounts")
      .delete()
      .eq("organizer_id", organizer.id);

    if (error) actionError(error.message);
    revalidatePath(`/dashboard/${organizer.slug}/settings/payments`);
  });
