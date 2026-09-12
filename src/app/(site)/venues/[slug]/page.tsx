import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, MapPin, Users } from "lucide-react";
import { getVenueBySlug } from "@/features/catalog/queries";
import { fetchEventPins } from "@/lib/events-map";
import { EventMap } from "@/components/map/event-map";
import { Card, SectionHeader } from "@/components/ui/surface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateBlock } from "@/components/ui/field-row";
import { EmptyState } from "@/components/ui/misc";
import { Breadcrumbs } from "@/components/ui/nav";
import { formatDateTime, formatNumber } from "@/lib/format";

export const revalidate = 300;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const venue = await getVenueBySlug(slug);
  if (!venue) return { title: "Venue" };

  const description =
    venue.description ?? `What's on at ${venue.name}${venue.city ? ` in ${venue.city}` : ""}.`;

  return {
    title: venue.name,
    description,
    openGraph: {
      title: venue.name,
      description,
      type: "website",
      images: venue.image_url ? [venue.image_url] : undefined,
    },
  };
}

export default async function VenuePage({ params }: Params) {
  const { slug } = await params;
  const venue = await getVenueBySlug(slug);
  if (!venue) notFound();

  // Reuses the map query rather than a bespoke one: same filters, same
  // published-only guarantees, and the pins are already in the right shape.
  const pins = (await fetchEventPins({ city: venue.city || undefined, limit: 100 })).filter(
    (pin) => pin.venue_name === venue.name,
  );

  const address = [venue.address_line1, venue.address_line2, venue.city, venue.state, venue.postal_code, venue.country]
    .filter(Boolean)
    .join(", ");

  const mapsHref =
    venue.latitude !== null && venue.longitude !== null
      ? `https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue.name} ${address}`)}`;

  const located =
    venue.latitude !== null && venue.longitude !== null
      ? { latitude: Number(venue.latitude), longitude: Number(venue.longitude) }
      : null;

  return (
    <div className="container-page py-10">
      <Breadcrumbs items={[{ label: "Discover", href: "/events" }, { label: venue.name }]} />

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="display-3 text-ink">{venue.name}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-md text-ink-2">
            <MapPin className="size-4 shrink-0 text-ink-3" aria-hidden />
            {address || venue.city || "Location to be announced"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {venue.capacity && (
            <Badge tone="neutral" size="md">
              <Users className="size-3" aria-hidden />
              Holds {formatNumber(venue.capacity)}
            </Badge>
          )}
          {!venue.is_active && <Badge tone="caution" size="md">Currently closed</Badge>}
          <Button asChild variant="outline" size="md">
            <a href={mapsHref} target="_blank" rel="noopener noreferrer">
              Open in Maps <ExternalLink />
            </a>
          </Button>
        </div>
      </div>

      {venue.description && (
        <p className="mt-5 max-w-prose text-md leading-relaxed text-ink-2">{venue.description}</p>
      )}

      {located && (
        <Card className="mt-8 overflow-hidden">
          <EventMap
            pins={pins.length > 0 ? pins : []}
            viewer={pins.length === 0 ? located : null}
            className="h-72"
          />
        </Card>
      )}

      <SectionHeader
        level={2}
        className="mt-12"
        title="What's on here"
        description={
          pins.length > 0
            ? `${pins.length} upcoming ${pins.length === 1 ? "event" : "events"}`
            : undefined
        }
      />

      {pins.length === 0 ? (
        <EmptyState
          className="mt-5"
          icon={MapPin}
          title="Nothing scheduled yet"
          description={`No upcoming events at ${venue.name}. Check back soon.`}
        />
      ) : (
        <Card className="mt-5 p-1">
          <ul className="divide-y divide-hairline-soft">
            {pins.map((pin) => (
              <li key={pin.id}>
                <Link
                  href={`/events/${pin.slug}`}
                  className="flex items-start gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-sunken"
                >
                  <DateBlock date={pin.starts_at} timeZone={pin.timezone ?? undefined} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-ink-3">
                      {formatDateTime(pin.starts_at, pin.timezone ?? undefined)}
                    </p>
                    <p className="mt-0.5 truncate text-base font-semibold text-ink">{pin.title}</p>
                    <p className="mt-0.5 truncate text-xs text-ink-3">By {pin.organizer_name}</p>
                  </div>
                  {pin.is_sold_out && <Badge tone="critical" size="xs">Sold out</Badge>}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
