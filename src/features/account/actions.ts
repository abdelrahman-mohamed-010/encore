"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionError, authActionClient } from "@/lib/safe-action";
import { profileSchema } from "@/lib/validation";
import { uuid } from "@/lib/validation/common";

export const updateProfile = authActionClient
  .inputSchema(profileSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { error } = await ctx.supabase
      .from("profiles")
      .update({
        full_name: `${parsedInput.firstName ?? ""} ${parsedInput.lastName ?? ""}`.trim() || null,
        phone: parsedInput.phone || null,
        bio: parsedInput.bio || null,
        avatar_url: parsedInput.avatarUrl || null,
        website: parsedInput.website || null,
        instagram: parsedInput.instagram || null,
        twitter: parsedInput.twitter || null,
        youtube: parsedInput.youtube || null,
        linkedin: parsedInput.linkedin || null,
      })
      .eq("id", ctx.user.id);

    if (error) actionError(error.message);
    revalidatePath("/account/settings");
  });

export const setEventFavorited = authActionClient
  .inputSchema(z.object({ eventId: uuid, favorited: z.boolean() }))
  .action(async ({ parsedInput, ctx }) => {
    const { error } = parsedInput.favorited
      ? await ctx.supabase
          .from("favorites")
          .insert({ event_id: parsedInput.eventId, user_id: ctx.user.id })
      : await ctx.supabase
          .from("favorites")
          .delete()
          .eq("event_id", parsedInput.eventId)
          .eq("user_id", ctx.user.id);

    if (error) actionError(error.message);
    revalidatePath("/account/saved");
  });
