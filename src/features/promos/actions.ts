"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionError, authActionClient, requireOrgAccess } from "@/lib/safe-action";
import { promoSchema } from "@/lib/validation";
import { uuid } from "@/lib/validation/common";

const organizerSlug = z.object({ organizerSlug: z.string().min(1) });

export const createPromo = authActionClient
  .inputSchema(z.intersection(promoSchema, organizerSlug))
  .action(async ({ parsedInput, ctx }) => {
    const { organizer } = await requireOrgAccess(parsedInput.organizerSlug, "staff");
    const numeric = Number(parsedInput.value);

    const { error } = await ctx.supabase.from("promo_codes").insert({
      organizer_id: organizer.id,
      event_id: parsedInput.eventId || null,
      code: parsedInput.code,
      discount_type: parsedInput.discountType,
      discount_value:
        parsedInput.discountType === "percentage" ? numeric : Math.round(numeric * 100),
      max_redemptions: parsedInput.maxRedemptions ? Number(parsedInput.maxRedemptions) : null,
      min_order_cents: Math.round(Number(parsedInput.minOrder || 0) * 100),
    });

    if (error) {
      actionError(
        error.code === "23505" ? "You already have a code with that name." : error.message,
      );
    }

    revalidatePath(`/dashboard/${organizer.slug}/promos`);
  });

export const setPromoActive = authActionClient
  .inputSchema(organizerSlug.extend({ id: uuid, isActive: z.boolean() }))
  .action(async ({ parsedInput, ctx }) => {
    const { organizer } = await requireOrgAccess(parsedInput.organizerSlug, "staff");

    const { error } = await ctx.supabase
      .from("promo_codes")
      .update({ is_active: parsedInput.isActive })
      .eq("id", parsedInput.id)
      .eq("organizer_id", organizer.id);

    if (error) actionError(error.message);
    revalidatePath(`/dashboard/${organizer.slug}/promos`);
  });

export const deletePromo = authActionClient
  .inputSchema(organizerSlug.extend({ id: uuid }))
  .action(async ({ parsedInput, ctx }) => {
    const { organizer } = await requireOrgAccess(parsedInput.organizerSlug, "staff");

    const { error } = await ctx.supabase
      .from("promo_codes")
      .delete()
      .eq("id", parsedInput.id)
      .eq("organizer_id", organizer.id);

    if (error) actionError(error.message);
    revalidatePath(`/dashboard/${organizer.slug}/promos`);
  });
