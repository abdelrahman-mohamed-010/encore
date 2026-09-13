import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function listMyOrders(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(
      `id, order_number, status, total_cents, currency, created_at, refunded_cents,
       event:events(id, title, slug, cover_image_url, starts_at, ends_at, timezone, is_online, venue:venues(name, city)),
       tickets:tickets(count)`,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getMyOrder(orderId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(
      `*,
       event:events(title, slug, starts_at, timezone, is_online, cover_image_url, venue:venues(name, city, country)),
       items:order_items(id, ticket_type_name, seat_label, quantity, unit_price_cents, subtotal_cents),
       tickets:tickets(id, ticket_code, status, seat_label),
       refunds:refunds(id, amount_cents, reason, status, created_at)`,
    )
    .eq("id", orderId)
    .maybeSingle();

  return data;
}

export async function listMyTickets(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tickets")
    .select(
      `id, ticket_code, qr_secret, status, seat_label, attendee_name, checked_in_at,
       ticket_type:ticket_types(name),
       event:events(id, title, slug, starts_at, ends_at, timezone, cover_image_url, is_online, venue:venues(name, city))`,
    )
    .eq("owner_user_id", userId)
    .order("issued_at", { ascending: false });

  return data ?? [];
}

export async function listMySavedEvents(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("favorites")
    .select(
      `event_id,
       event:events(id, slug, title, subtitle, cover_image_url, starts_at, ends_at, timezone,
         is_online, is_featured,
         venue:venues(name, city, country),
         category:categories(name, slug, color),
         organizer:organizers(name, slug),
         ticket_types(price_cents, currency, quantity_total, quantity_sold, quantity_reserved, is_hidden))`,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return data ?? [];
}
