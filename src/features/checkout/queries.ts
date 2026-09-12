import "server-only";
import { createClient } from "@/lib/supabase/server";

export type CheckoutLine = {
  id: string;
  name: string;
  currency: string;
  quantity: number;
  unitPriceCents: number;
  seatLabel: string | null;
};

export async function getReservationForCheckout(reservationId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("reservations")
    .select(
      `id, status, expires_at, user_id, event_id,
       event:events(id, title, slug, starts_at, ends_at, timezone, cover_image_url, is_online,
         organizer:organizers(id, name, slug),
         venue:venues(name, city, country))`,
    )
    .eq("id", reservationId)
    .maybeSingle();

  return data;
}

export async function releaseExpiredHolds(eventId: string) {
  const supabase = await createClient();
  await supabase.rpc("expire_reservations", { p_event_id: eventId });
}

async function seatLabelsFor(seatIds: string[]) {
  const labels = new Map<string, string>();
  if (seatIds.length === 0) return labels;

  const supabase = await createClient();
  const { data } = await supabase
    .from("event_seats")
    .select("id, seat:venue_seats(row_label, seat_number, section:venue_sections(name))")
    .in("id", seatIds);

  for (const seat of data ?? []) {
    const place = seat.seat;
    if (!place) continue;
    labels.set(
      seat.id,
      [place.section?.name, `Row ${place.row_label}`, `Seat ${place.seat_number}`]
        .filter(Boolean)
        .join(" · "),
    );
  }
  return labels;
}

export async function getCheckoutContext(reservationId: string, userId: string) {
  const supabase = await createClient();

  const [{ data: items }, { data: profile }, { data: settings }] = await Promise.all([
    supabase
      .from("reservation_items")
      .select(
        `id, quantity, unit_price_cents, event_seat_id,
         ticket_type:ticket_types(id, name, currency)`,
      )
      .eq("reservation_id", reservationId),
    supabase.from("profiles").select("full_name, email, phone").eq("id", userId).maybeSingle(),
    supabase
      .from("platform_settings")
      .select("platform_fee_percent, platform_fee_fixed_cents")
      .maybeSingle(),
  ]);

  const seatIds = (items ?? []).map((i) => i.event_seat_id).filter(Boolean) as string[];
  const seatLabels = await seatLabelsFor(seatIds);

  const lines: CheckoutLine[] = (items ?? []).map((item) => ({
    id: item.id,
    name: item.ticket_type?.name ?? "Ticket",
    currency: item.ticket_type?.currency ?? "USD",
    quantity: item.quantity,
    unitPriceCents: item.unit_price_cents,
    seatLabel: item.event_seat_id ? (seatLabels.get(item.event_seat_id) ?? null) : null,
  }));

  return { lines, profile, settings };
}

export async function getOrderForPayment(orderId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("id, user_id, status, total_cents, currency, order_number, payment_provider")
    .eq("id", orderId)
    .maybeSingle();
  return data;
}
