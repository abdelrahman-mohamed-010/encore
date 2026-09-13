import Link from "next/link";
import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { listMySavedEvents } from "@/features/account/queries";
import { requireUser } from "@/lib/auth";
import { EventCard } from "@/features/catalog/components/event-card";

import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import type { EventSearchResult } from "@/lib/types";

export const metadata: Metadata = { title: "Saved events" };

export default async function SavedPage() {
  const user = await requireUser();
  const favorites = await listMySavedEvents(user.id);

  // Reshape into the same row the search RPC produces so EventCard stays one component.
  const events: EventSearchResult[] = favorites
    .filter((row) => row.event)
    .map((row) => {
      const event = row.event!;
      const tiers = (event.ticket_types ?? []).filter((t) => !t.is_hidden);
      const prices = tiers.map((t) => t.price_cents);
      const left = tiers.reduce(
        (sum, t) => sum + Math.max(0, t.quantity_total - t.quantity_sold - t.quantity_reserved),
        0,
      );

      return {
        id: event.id,
        slug: event.slug,
        title: event.title,
        subtitle: event.subtitle,
        cover_image_url: event.cover_image_url,
        starts_at: event.starts_at,
        ends_at: event.ends_at,
        timezone: event.timezone,
        is_online: event.is_online,
        is_featured: event.is_featured,
        city: event.venue?.city ?? "",
        country: event.venue?.country ?? "",
        venue_name: event.venue?.name ?? null,
        category_name: event.category?.name ?? null,
        category_slug: event.category?.slug ?? null,
        category_color: event.category?.color ?? null,
        organizer_name: event.organizer?.name ?? "",
        organizer_slug: event.organizer?.slug ?? "",
        min_price_cents: prices.length ? Math.min(...prices) : 0,
        max_price_cents: prices.length ? Math.max(...prices) : 0,
        currency: tiers[0]?.currency ?? "USD",
        tickets_left: left,
        is_sold_out: left <= 0,
        total_count: 0,
      };
    });

  if (events.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="Nothing saved yet"
        description="Tap Save on any event and it will wait for you here."
        action={
          <Button asChild variant="solid" size="md">
            <Link href="/events">Discover events</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
