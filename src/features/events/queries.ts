import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { EventSeat, TicketAvailability, VenueSeat, VenueSection } from "@/lib/types";

export type SeatWithPlace = EventSeat & {
  seat:
    | (Pick<VenueSeat, "id" | "row_label" | "seat_number" | "pos_x" | "pos_y"> & {
        section: Pick<VenueSection, "id" | "name" | "code" | "color"> | null;
      })
    | null;
};

/**
 * Memoised per request: the page and generateMetadata both need it, and the
 * hold sweep below must not run twice for one view.
 */
export const getEventBySlug = cache(async (slug: string) => {
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select(
      `*,
       organizer:organizers(id, name, slug, logo_url, description, verification_status),
       venue:venues(id, name, slug, address_line1, city, country, timezone, latitude, longitude, image_url),
       category:categories(id, name, slug, color)`,
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!event) return null;

  // Release any hold whose ten minutes are up before reading the inventory, so
  // the page a buyer is looking at never shows an abandoned checkout's seats as
  // taken. A scheduled sweep does this every minute too.
  await supabase.rpc("expire_reservations", { p_event_id: event.id });

  const [{ data: availability }, { data: seats }, { data: types }] = await Promise.all([
    supabase.rpc("event_availability", { p_event_id: event.id }),
    event.seating_type === "reserved_seating"
      ? supabase
          .from("event_seats")
          .select(
            `id, status, price_cents, ticket_type_id,
             seat:venue_seats(id, row_label, seat_number, pos_x, pos_y,
               section:venue_sections(id, name, code, color))`,
          )
          .eq("event_id", event.id)
      : Promise.resolve({ data: [] as SeatWithPlace[] }),
    supabase.from("ticket_types").select("id, section_id").eq("event_id", event.id),
  ]);

  const seatedTypeIds = new Set(
    (types ?? []).filter((type) => type.section_id).map((type) => type.id),
  );

  const all = (availability ?? []) as TicketAvailability[];

  return {
    event,
    availability: all,
    seatedAvailability: all.filter((tier) => seatedTypeIds.has(tier.ticket_type_id)),
    generalAvailability: all.filter((tier) => !seatedTypeIds.has(tier.ticket_type_id)),
    seats: (seats ?? []) as SeatWithPlace[],
  };
});

export async function getEventSocialCounts(eventId: string, userId: string | null) {
  const supabase = await createClient();

  const [{ data: favorite }, { count: attendeeCount }] = await Promise.all([
    userId
      ? supabase
          .from("favorites")
          .select("event_id")
          .eq("event_id", eventId)
          .eq("user_id", userId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .in("status", ["valid", "used"]),
  ]);

  return { favorited: Boolean(favorite), attendeeCount: attendeeCount ?? 0 };
}
