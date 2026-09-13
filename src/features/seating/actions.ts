"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionError, authActionClient, requireOrgAccess } from "@/lib/safe-action";
import { seatingSchema } from "@/lib/validation";
import { uuid } from "@/lib/validation/common";
import { generateSeats, sectionCode, type SectionSpec } from "@/features/seating/seat-layout";

const target = z.object({
  eventId: uuid,
  venueId: uuid,
  organizerSlug: z.string().min(1),
});

export const buildSeatMap = authActionClient
  .inputSchema(z.intersection(seatingSchema, target.extend({ ticketTypeCount: z.number().int().min(0) })))
  .action(async ({ parsedInput, ctx }) => {
    const { organizer } = await requireOrgAccess(parsedInput.organizerSlug, "admin");
    const { supabase } = ctx;
    const { eventId, venueId, ticketTypeCount } = parsedInput;

    const { data: event } = await supabase
      .from("events")
      .select("id, organizer_id")
      .eq("id", eventId)
      .maybeSingle();
    if (!event || event.organizer_id !== organizer.id) {
      actionError("That event does not belong to this organizer.");
    }

    const specs: SectionSpec[] = parsedInput.sections.map((section) => ({
      name: section.name,
      color: section.color,
      rows: Number(section.rows),
      seatsPerRow: Number(section.seatsPerRow),
      priceCents: Math.round(Number(section.price) * 100),
    }));

    const createdSections: string[] = [];
    const createdTicketTypes: string[] = [];
    let seatCount = 0;

    try {
      for (const [index, { section, seats }] of generateSeats(specs).entries()) {
        const { data: sectionRow, error: sectionError } = await supabase
          .from("venue_sections")
          .insert({
            venue_id: venueId,
            name: section.name,
            code: sectionCode(section.name, index),
            color: section.color,
            sort_order: index,
          })
          .select("id")
          .single();
        if (sectionError) throw new Error(sectionError.message);
        createdSections.push(sectionRow.id);

        const { data: ticketType, error: typeError } = await supabase
          .from("ticket_types")
          .insert({
            event_id: eventId,
            section_id: sectionRow.id,
            name: section.name,
            price_cents: section.priceCents,
            quantity_total: seats.length,
            sort_order: ticketTypeCount + index,
          })
          .select("id")
          .single();
        if (typeError) throw new Error(typeError.message);
        createdTicketTypes.push(ticketType.id);

        const { data: seatRows, error: seatError } = await supabase
          .from("venue_seats")
          .insert(
            seats.map((seat) => ({
              venue_id: venueId,
              section_id: sectionRow.id,
              row_label: seat.rowLabel,
              seat_number: seat.seatNumber,
              pos_x: seat.posX,
              pos_y: seat.posY,
            })),
          )
          .select("id");
        if (seatError) throw new Error(seatError.message);

        const { error: inventoryError } = await supabase.from("event_seats").insert(
          (seatRows ?? []).map((seat) => ({
            event_id: eventId,
            seat_id: seat.id,
            ticket_type_id: ticketType.id,
          })),
        );
        if (inventoryError) throw new Error(inventoryError.message);
        seatCount += seats.length;
      }

      // Only flip the event once its inventory exists, so the public page never
      // renders a reserved-seating event with no seats to pick.
      const { error: eventError } = await supabase
        .from("events")
        .update({ seating_type: "reserved_seating" })
        .eq("id", eventId);
      if (eventError) throw new Error(eventError.message);

      await supabase.from("venues").update({ seating_type: "reserved_seating" }).eq("id", venueId);
    } catch (error) {
      if (createdTicketTypes.length) {
        await supabase.from("ticket_types").delete().in("id", createdTicketTypes);
      }
      if (createdSections.length) {
        await supabase.from("venue_sections").delete().in("id", createdSections);
      }
      actionError((error as Error).message);
    }

    revalidatePath(`/dashboard/${organizer.slug}/events/${eventId}`);
    return { seatCount };
  });

export const adoptVenueSeatMap = authActionClient
  .inputSchema(target)
  .action(async ({ parsedInput, ctx }) => {
    const { organizer } = await requireOrgAccess(parsedInput.organizerSlug, "admin");
    const { supabase } = ctx;
    const { eventId, venueId } = parsedInput;

    const { data: event } = await supabase
      .from("events")
      .select("id, organizer_id")
      .eq("id", eventId)
      .maybeSingle();
    if (!event || event.organizer_id !== organizer.id) {
      actionError("That event does not belong to this organizer.");
    }

    const { data: seats, error } = await supabase
      .from("venue_seats")
      .select("id, section_id")
      .eq("venue_id", venueId);
    if (error) actionError(error.message);

    const { data: types, error: typeError } = await supabase
      .from("ticket_types")
      .select("id, section_id")
      .eq("event_id", eventId)
      .not("section_id", "is", null);
    if (typeError) actionError(typeError.message);

    const typeBySection = new Map((types ?? []).map((type) => [type.section_id, type.id]));
    if ((seats ?? []).some((seat) => !typeBySection.has(seat.section_id))) {
      actionError("Some sections have no ticket type on this event yet. Add one per section first.");
    }

    const { error: insertError } = await supabase.from("event_seats").insert(
      (seats ?? []).map((seat) => ({
        event_id: eventId,
        seat_id: seat.id,
        ticket_type_id: typeBySection.get(seat.section_id)!,
      })),
    );
    if (insertError) actionError(insertError.message);

    const { error: eventError } = await supabase
      .from("events")
      .update({ seating_type: "reserved_seating" })
      .eq("id", eventId);
    if (eventError) actionError(eventError.message);

    revalidatePath(`/dashboard/${organizer.slug}/events/${eventId}`);
  });
