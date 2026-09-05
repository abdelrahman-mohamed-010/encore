import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { CheckoutClient } from "./checkout-client";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ reservationId: string }>;
}) {
  const { reservationId } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: reservation } = await supabase
    .from("reservations")
    .select(
      `id, status, expires_at, user_id, event_id,
       event:events(id, title, slug, starts_at, ends_at, timezone, cover_image_url, is_online,
         organizer:organizers(id, name, slug),
         venue:venues(name, city, country))`,
    )
    .eq("id", reservationId)
    .maybeSingle();

  if (!reservation) notFound();
  if (reservation.user_id !== user.id) notFound();

  // A dead hold cannot be paid for — send them back to pick again. Release it
  // on the way out so the seats are on sale again by the time they land, rather
  // than sitting held until something else happens to sweep them.
  if (reservation.status !== "active" || new Date(reservation.expires_at) < new Date()) {
    await supabase.rpc("expire_reservations", { p_event_id: reservation.event_id });
    redirect(`/events/${reservation.event?.slug ?? ""}?expired=1`);
  }

  const [{ data: items }, { data: profile }, { data: settings }] = await Promise.all([
    supabase
      .from("reservation_items")
      .select(
        `id, quantity, unit_price_cents, event_seat_id,
         ticket_type:ticket_types(id, name, currency)`,
      )
      .eq("reservation_id", reservationId),
    supabase.from("profiles").select("full_name, email, phone").eq("id", user.id).maybeSingle(),
    supabase
      .from("platform_settings")
      .select("platform_fee_percent, platform_fee_fixed_cents")
      .maybeSingle(),
  ]);

  // Seat labels come from a helper so the summary matches the ticket exactly.
  const seatIds = (items ?? []).map((i) => i.event_seat_id).filter(Boolean) as string[];
  const seatLabels = new Map<string, string>();
  if (seatIds.length > 0) {
    const { data: seats } = await supabase
      .from("event_seats")
      .select("id, seat:venue_seats(row_label, seat_number, section:venue_sections(name))")
      .in("id", seatIds);

    for (const seat of seats ?? []) {
      const place = seat.seat as unknown as
        | { row_label: string; seat_number: string; section: { name: string } | null }
        | null;
      if (place) {
        seatLabels.set(
          seat.id,
          [place.section?.name, `Row ${place.row_label}`, `Seat ${place.seat_number}`]
            .filter(Boolean)
            .join(" · "),
        );
      }
    }
  }

  const lines = (items ?? []).map((item) => ({
    id: item.id,
    name: item.ticket_type?.name ?? "Ticket",
    currency: item.ticket_type?.currency ?? "USD",
    quantity: item.quantity,
    unitPriceCents: item.unit_price_cents,
    seatLabel: item.event_seat_id ? (seatLabels.get(item.event_seat_id) ?? null) : null,
  }));

  return (
    <CheckoutClient
      reservationId={reservation.id}
      expiresAt={reservation.expires_at}
      event={{
        id: reservation.event!.id,
        title: reservation.event!.title,
        slug: reservation.event!.slug,
        startsAt: reservation.event!.starts_at,
        timezone: reservation.event!.timezone,
        coverImageUrl: reservation.event!.cover_image_url,
        organizerName: reservation.event!.organizer?.name ?? "",
        placeLabel: reservation.event!.is_online
          ? "Online event"
          : [reservation.event!.venue?.name, reservation.event!.venue?.city]
              .filter(Boolean)
              .join(" · "),
      }}
      lines={lines}
      buyer={{
        name: profile?.full_name ?? "",
        email: profile?.email ?? user.email ?? "",
        phone: profile?.phone ?? "",
      }}
      feeSettings={{
        percentCents: Number(settings?.platform_fee_percent ?? 5),
        fixedCents: settings?.platform_fee_fixed_cents ?? 99,
      }}
    />
  );
}
