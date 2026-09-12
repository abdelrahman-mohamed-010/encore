import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  getCheckoutContext,
  getReservationForCheckout,
  releaseExpiredHolds,
} from "@/features/checkout/queries";
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
  const reservation = await getReservationForCheckout(reservationId);

  if (!reservation) notFound();
  if (reservation.user_id !== user.id) notFound();

  // A dead hold cannot be paid for — send them back to pick again. Release it
  // on the way out so the seats are on sale again by the time they land.
  if (reservation.status !== "active" || new Date(reservation.expires_at) < new Date()) {
    await releaseExpiredHolds(reservation.event_id);
    redirect(`/events/${reservation.event?.slug ?? ""}?expired=1`);
  }

  const { lines, profile, settings } = await getCheckoutContext(reservationId, user.id);

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
