"use server";

import { z } from "zod";
import { actionError, authActionClient, requireOrgAccess } from "@/lib/safe-action";
import { uuid } from "@/lib/validation/common";

const slug = z.object({ organizerSlug: z.string().min(1) });

export type EventFormOption = { id: string; name: string; city?: string | null };

export type PreviewSeat = {
  id: string;
  status: string;
  seat: {
    row_label: string;
    seat_number: string;
    pos_x: number;
    pos_y: number;
    section: { id: string; name: string; color: string } | null;
  } | null;
};

export const loadEventFormOptions = authActionClient
  .inputSchema(slug)
  .action(async ({ parsedInput, ctx }) => {
    const { organizer } = await requireOrgAccess(parsedInput.organizerSlug, "staff");

    const [{ data: categories }, { data: venues }] = await Promise.all([
      ctx.supabase.from("categories").select("id, name").eq("is_active", true).order("sort_order"),
      ctx.supabase
        .from("venues")
        .select("id, name, city, seating_type")
        .or(`organizer_id.eq.${organizer.id},organizer_id.is.null`)
        .eq("is_active", true)
        .order("name"),
    ]);

    return {
      categories: (categories ?? []) as EventFormOption[],
      venues: (venues ?? []) as EventFormOption[],
    };
  });

export const loadEventSeatMap = authActionClient
  .inputSchema(slug.extend({ eventId: uuid }))
  .action(async ({ parsedInput, ctx }) => {
    const { organizer } = await requireOrgAccess(parsedInput.organizerSlug, "staff");

    const { data: event } = await ctx.supabase
      .from("events")
      .select("id, organizer_id")
      .eq("id", parsedInput.eventId)
      .maybeSingle();

    if (!event || event.organizer_id !== organizer.id) {
      actionError("That event does not belong to this organizer.");
    }

    const { data } = await ctx.supabase
      .from("event_seats")
      .select(
        `id, status,
         seat:venue_seats(row_label, seat_number, pos_x, pos_y,
           section:venue_sections(id, name, color))`,
      )
      .eq("event_id", parsedInput.eventId);

    return { seats: (data ?? []) as PreviewSeat[] };
  });
