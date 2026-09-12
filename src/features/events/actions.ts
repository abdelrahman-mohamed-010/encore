"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionError, authActionClient, requireOrgAccess } from "@/lib/safe-action";
import { eventSchema, ticketTypeSchema } from "@/lib/validation";
import { uuid } from "@/lib/validation/common";

const slug = z.object({ organizerSlug: z.string().min(1) });

async function assertEventInOrg(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  eventId: string,
  organizerId: string,
) {
  const { data } = await supabase
    .from("events")
    .select("id, organizer_id")
    .eq("id", eventId)
    .maybeSingle();

  if (!data || data.organizer_id !== organizerId) {
    actionError("That event does not belong to this organizer.");
  }
}

export const saveEvent = authActionClient
  .inputSchema(z.intersection(eventSchema, slug.extend({ eventId: uuid.optional(), timezone: z.string().min(1) })))
  .action(async ({ parsedInput, ctx }) => {
    const { organizer } = await requireOrgAccess(parsedInput.organizerSlug, "staff");
    if (parsedInput.eventId) {
      await assertEventInOrg(ctx.supabase, parsedInput.eventId, organizer.id);
    }

    const payload = {
      organizer_id: organizer.id,
      title: parsedInput.title,
      subtitle: parsedInput.subtitle || null,
      description: parsedInput.description || null,
      category_id: parsedInput.categoryId || null,
      venue_id: parsedInput.isOnline ? null : parsedInput.venueId || null,
      is_online: parsedInput.isOnline,
      online_url: parsedInput.isOnline ? parsedInput.onlineUrl : null,
      starts_at: new Date(parsedInput.startsAt).toISOString(),
      ends_at: new Date(parsedInput.endsAt).toISOString(),
      cover_image_url: parsedInput.coverImageUrl || null,
      tags: parsedInput.tags,
      refund_policy: parsedInput.refundPolicy || null,
      min_age: parsedInput.minAge ? Number(parsedInput.minAge) : null,
      timezone: parsedInput.timezone,
    };

    const { data, error } = parsedInput.eventId
      ? await ctx.supabase
          .from("events")
          .update(payload)
          .eq("id", parsedInput.eventId)
          .select("id")
          .single()
      : await ctx.supabase.from("events").insert(payload).select("id").single();

    if (error) actionError(error.message);

    revalidatePath(`/dashboard/${organizer.slug}/events`);
    return { eventId: data.id };
  });

export const setEventStatus = authActionClient
  .inputSchema(
    slug.extend({
      eventId: uuid,
      status: z.enum(["published", "draft", "paused", "pending_review", "cancelled", "completed"]),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { organizer } = await requireOrgAccess(parsedInput.organizerSlug, "admin");
    await assertEventInOrg(ctx.supabase, parsedInput.eventId, organizer.id);

    const { error } = await ctx.supabase
      .from("events")
      .update({ status: parsedInput.status })
      .eq("id", parsedInput.eventId);

    if (error) actionError(error.message);
    revalidatePath(`/dashboard/${organizer.slug}/events/${parsedInput.eventId}`);
  });

export const saveTicketType = authActionClient
  .inputSchema(
    z.intersection(
      ticketTypeSchema,
      slug.extend({ eventId: uuid, id: uuid.optional(), sortOrder: z.number().int().min(0) }),
    ),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { organizer } = await requireOrgAccess(parsedInput.organizerSlug, "staff");
    await assertEventInOrg(ctx.supabase, parsedInput.eventId, organizer.id);

    const quantity = Number(parsedInput.quantityTotal);

    // Capacity can be lowered, but never below what is already committed.
    if (parsedInput.id) {
      const { data: existing } = await ctx.supabase
        .from("ticket_types")
        .select("quantity_sold, quantity_reserved")
        .eq("id", parsedInput.id)
        .maybeSingle();

      if (!existing) actionError("That ticket type no longer exists.");
      const committed = existing.quantity_sold + existing.quantity_reserved;
      if (quantity < committed) {
        actionError(`You cannot go below ${committed} — that many are already sold or held.`);
      }
    }

    const payload = {
      event_id: parsedInput.eventId,
      name: parsedInput.name,
      description: parsedInput.description || null,
      price_cents: Math.round(Number(parsedInput.price) * 100),
      quantity_total: quantity,
      min_per_order: Number(parsedInput.minPerOrder),
      max_per_order: Number(parsedInput.maxPerOrder),
      is_hidden: parsedInput.isHidden,
      section_id: parsedInput.sectionId || null,
      sort_order: parsedInput.sortOrder,
    };

    const { error } = parsedInput.id
      ? await ctx.supabase.from("ticket_types").update(payload).eq("id", parsedInput.id)
      : await ctx.supabase.from("ticket_types").insert(payload);

    if (error) actionError(error.message);
    revalidatePath(`/dashboard/${organizer.slug}/events/${parsedInput.eventId}`);
  });

export const deleteTicketType = authActionClient
  .inputSchema(slug.extend({ id: uuid, eventId: uuid }))
  .action(async ({ parsedInput, ctx }) => {
    const { organizer } = await requireOrgAccess(parsedInput.organizerSlug, "staff");
    await assertEventInOrg(ctx.supabase, parsedInput.eventId, organizer.id);

    const { data: tier } = await ctx.supabase
      .from("ticket_types")
      .select("quantity_sold")
      .eq("id", parsedInput.id)
      .maybeSingle();

    if (!tier) actionError("That ticket type no longer exists.");
    if (tier.quantity_sold > 0) {
      actionError("This ticket type has sales and cannot be deleted. Hide it instead.");
    }

    const { error } = await ctx.supabase.from("ticket_types").delete().eq("id", parsedInput.id);
    if (error) actionError(error.message);

    revalidatePath(`/dashboard/${organizer.slug}/events/${parsedInput.eventId}`);
  });
