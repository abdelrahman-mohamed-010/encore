import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { EventSeat, EventStats, TicketAvailability, VenueSeat, VenueSection } from "@/lib/types";

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

function activeCategories(supabase: Awaited<ReturnType<typeof createClient>>) {
  return supabase.from("categories").select("id, name").eq("is_active", true).order("sort_order");
}

/** Venues the organizer owns, plus the shared public ones. */
export async function getNewEventFormOptions(organizerId: string) {
  const supabase = await createClient();

  const [{ data: categories }, { data: venues }] = await Promise.all([
    activeCategories(supabase),
    supabase
      .from("venues")
      .select("id, name, city, seating_type")
      .or(`organizer_id.eq.${organizerId},organizer_id.is.null`)
      .eq("is_active", true)
      .order("name"),
  ]);

  return { categories: categories ?? [], venues: venues ?? [] };
}

export async function getEditEventFormOptions(organizerId: string) {
  const supabase = await createClient();

  const [{ data: categories }, { data: venues }] = await Promise.all([
    activeCategories(supabase),
    supabase
      .from("venues")
      .select("id, name, city")
      .or(`organizer_id.eq.${organizerId},organizer_id.is.null`)
      .eq("is_active", true)
      .order("name"),
  ]);

  return { categories: categories ?? [], venues: venues ?? [] };
}

export async function getOrganizerEvent(eventId: string, organizerId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .eq("organizer_id", organizerId)
    .maybeSingle();
  return data;
}

export async function getEventDetail(eventId: string, organizerId: string) {
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("*, venue:venues(id, name, city), category:categories(name)")
    .eq("id", eventId)
    .eq("organizer_id", organizerId)
    .maybeSingle();

  if (!event) return null;

  const [{ data: statsData }, { data: ticketTypes }, { data: venueSections }, { count: soldOrHeld }] =
    await Promise.all([
      supabase.rpc("event_stats", { p_event_id: eventId }),
      supabase.from("ticket_types").select("*").eq("event_id", eventId).order("sort_order"),
      event.venue_id
        ? supabase
            .from("venue_sections")
            .select("id, name, color, venue_seats(count)")
            .eq("venue_id", event.venue_id)
            .order("sort_order")
        : Promise.resolve({ data: [] }),
      supabase
        .from("event_seats")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId)
        .neq("status", "available"),
    ]);

  return {
    event,
    stats: (statsData ?? {}) as EventStats,
    ticketTypes: ticketTypes ?? [],
    venueSections: (venueSections ?? []) as {
      id: string;
      name: string;
      color: string;
      venue_seats: { count: number }[];
    }[],
    soldOrHeld: soldOrHeld ?? 0,
  };
}
