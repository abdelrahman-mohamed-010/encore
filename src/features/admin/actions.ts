"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionError, authActionClient } from "@/lib/safe-action";
import { requireAdmin } from "@/lib/auth";
import { categorySchema, slugify } from "@/lib/validation";
import { uuid } from "@/lib/validation/common";

const adminAction = authActionClient.use(async ({ next }) => {
  await requireAdmin();
  return next();
});

export const createCategory = adminAction
  .inputSchema(categorySchema.extend({ sortOrder: z.number().int().min(0) }))
  .action(async ({ parsedInput, ctx }) => {
    const { error } = await ctx.supabase.from("categories").insert({
      name: parsedInput.name,
      slug: slugify(parsedInput.name),
      color: parsedInput.color,
      sort_order: parsedInput.sortOrder,
    });

    if (error) {
      actionError(error.code === "23505" ? "That category already exists." : error.message);
    }
    revalidatePath("/admin/categories");
  });

export const setCategoryActive = adminAction
  .inputSchema(z.object({ id: uuid, isActive: z.boolean() }))
  .action(async ({ parsedInput, ctx }) => {
    const { error } = await ctx.supabase
      .from("categories")
      .update({ is_active: parsedInput.isActive })
      .eq("id", parsedInput.id);

    if (error) actionError(error.message);
    revalidatePath("/admin/categories");
  });

export const deleteCategory = adminAction
  .inputSchema(z.object({ id: uuid }))
  .action(async ({ parsedInput, ctx }) => {
    const { error } = await ctx.supabase.from("categories").delete().eq("id", parsedInput.id);
    if (error) {
      actionError("Events may still reference this category. Deactivate it instead.");
    }
    revalidatePath("/admin/categories");
  });

export const updateUser = adminAction
  .inputSchema(
    z.object({
      id: uuid,
      role: z.enum(["attendee", "organizer", "admin"]).optional(),
      isBanned: z.boolean().optional(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const patch: { role?: "attendee" | "organizer" | "admin"; is_banned?: boolean } = {};
    if (parsedInput.role !== undefined) patch.role = parsedInput.role;
    if (parsedInput.isBanned !== undefined) patch.is_banned = parsedInput.isBanned;

    const { error } = await ctx.supabase.from("profiles").update(patch).eq("id", parsedInput.id);
    if (error) actionError(error.message);
    revalidatePath("/admin/users");
  });

export const setEventReviewStatus = adminAction
  .inputSchema(
    z.object({
      id: uuid,
      status: z.enum(["published", "draft", "paused", "pending_review", "cancelled", "completed"]),
      reason: z.string().trim().max(300).optional(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { error } = await ctx.supabase
      .from("events")
      .update({ status: parsedInput.status, rejection_reason: parsedInput.reason ?? null })
      .eq("id", parsedInput.id);

    if (error) actionError(error.message);
    revalidatePath("/admin/events");
  });
