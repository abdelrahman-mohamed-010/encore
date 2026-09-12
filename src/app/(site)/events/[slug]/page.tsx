import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  Clock, MapPin, ShieldCheck, Tag, Ticket, Users, Video,
} from "lucide-react";
import { getEventBySlug, getEventSocialCounts } from "@/features/events/queries";
import { getUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";

import { Avatar } from "@/components/ui/avatar";import { VerifiedBadge } from "@/components/ui/verified-badge";
import { Card, Divider } from "@/components/ui/surface";
import { FieldRow, InfoRow } from "@/components/ui/field-row";
import { TicketPicker } from "@/features/events/components/ticket-picker";
import { SeatMap } from "@/features/events/components/seat-map";
import { FavoriteButton } from "@/features/account/components/favorite-button";
import { ShareButton } from "@/features/events/components/share-button";
import { formatDate, formatTime, pluralize } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const loaded = await getEventBySlug(slug);
  if (!loaded) return { title: "Event not found" };

  const { event } = loaded;
  return {
    title: event.title,
    description: event.subtitle ?? event.description?.slice(0, 160) ?? undefined,
    openGraph: {
      title: event.title,
      description: event.subtitle ?? undefined,
      images: event.cover_image_url ? [event.cover_image_url] : undefined,
      type: "website",
    },
  };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const loaded = await getEventBySlug(slug);
  if (!loaded) notFound();

  const { event, availability, seatedAvailability, generalAvailability, seats } = loaded;
  const user = await getUser();
  const { favorited, attendeeCount } = await getEventSocialCounts(event.id, user?.id ?? null);

  const tz = event.timezone ?? undefined;
  const isPast = new Date(event.ends_at) < new Date();
  const isCancelled = event.status === "cancelled";
  const totalLeft = availability.reduce((sum, t) => sum + t.available, 0);
  const soldOut = totalLeft <= 0;

  const prices = availability.map((t) => t.price_cents / 100);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.subtitle ?? event.description?.slice(0, 300) ?? undefined,
    startDate: event.starts_at,
    endDate: event.ends_at,
    eventStatus: isCancelled
      ? "https://schema.org/EventCancelled"
      : "https://schema.org/EventScheduled",
    eventAttendanceMode: event.is_online
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    image: event.cover_image_url ? [event.cover_image_url] : undefined,
    location: event.is_online
      ? { "@type": "VirtualLocation", url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/events/${slug}` }
      : {
          "@type": "Place",
          name: event.venue?.name,
          address: {
            "@type": "PostalAddress",
            streetAddress: event.venue?.address_line1 ?? undefined,
            addressLocality: event.venue?.city ?? undefined,
            addressCountry: event.venue?.country ?? undefined,
          },
        },
    organizer: event.organizer
      ? { "@type": "Organization", name: event.organizer.name }
      : undefined,
    offers: prices.length
      ? {
          "@type": "AggregateOffer",
          priceCurrency: availability[0]?.currency ?? "USD",
          lowPrice: Math.min(...prices),
          highPrice: Math.max(...prices),
          availability: soldOut ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
          url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/events/${slug}`,
        }
      : undefined,
  };

  return (
    <div className="container-narrow py-8 md:py-14">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-14">
        {/* ---- Left rail: poster, organizer, venue ------------------------- */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-sunken shadow-e1">
            {event.cover_image_url ? (
              <Image
                src={event.cover_image_url}
                alt={event.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 22rem"
                className="object-cover"
              />
            ) : (
              <div className="size-full bg-gradient-to-br from-sunken to-sunken-2" />
            )}
          </div>

          <div className="mt-5 space-y-5">
            <div>
              <p className="eyebrow mb-2.5">Hosted by</p>
              <Link
                href={`/organizers/${event.organizer?.slug}`}
                className="flex items-center gap-3 rounded-lg p-1 -m-1 transition-colors hover:bg-sunken"
              >
                <Avatar src={event.organizer?.logo_url} name={event.organizer?.name} size="md" />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate text-base font-medium text-ink">
                    {event.organizer?.name}
                    {event.organizer?.verification_status === "verified" && (
                      <VerifiedBadge size="xs" />
                    )}
                  </p>
                  <p className="truncate text-sm text-ink-3">View all events</p>
                </div>
              </Link>
            </div>

            {event.venue && !event.is_online && (
              <>
                <Divider />
                <div>
                  <p className="eyebrow mb-2.5">Venue</p>
                  <Link
                    href={`/venues/${event.venue.slug}`}
                    className="text-base font-medium text-ink hover:underline"
                  >
                    {event.venue.name}
                  </Link>
                  <p className="mt-1 text-sm leading-relaxed text-ink-3">
                    {[event.venue.address_line1, event.venue.city, event.venue.country]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  {event.venue.latitude && event.venue.longitude && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${event.venue.latitude},${event.venue.longitude}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-2.5 inline-block text-sm font-medium text-ink underline decoration-line-2 underline-offset-4 hover:decoration-ink"
                    >
                      Open in Maps
                    </a>
                  )}
                </div>
              </>
            )}

            <Divider />
            <div className="flex gap-2">
              <FavoriteButton
                eventId={event.id}
                initialFavorited={favorited}
                signedIn={Boolean(user)}
              />
              <ShareButton title={event.title} />
            </div>
          </div>
        </div>

        {/* ---- Right column: the event itself ------------------------------ */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {event.category && (
              <Badge tone="neutral" size="md">
                <Tag className="size-3" />
                {event.category.name}
              </Badge>
            )}
            {event.is_featured && <Badge tone="solid" size="md">Featured</Badge>}
            {isCancelled && <Badge tone="critical" size="md">Cancelled</Badge>}
            {!isCancelled && soldOut && <Badge tone="critical" size="md">Sold out</Badge>}
            {event.min_age ? <Badge tone="outline" size="md">{event.min_age}+</Badge> : null}
          </div>

          <h1 className="display-2 font-flourish mt-5 text-ink">{event.title}</h1>
          {event.subtitle && (
            <p className="mt-4 text-lg leading-relaxed text-ink-2">{event.subtitle}</p>
          )}

          <div className="mt-8 space-y-6">
            <InfoRow
              date={event.starts_at}
              timeZone={tz}
              main={formatDate(event.starts_at, "full", tz)}
              sub={`${formatTime(event.starts_at, tz)} – ${formatTime(event.ends_at, tz)}${
                tz ? ` · ${tz.replace("_", " ")}` : ""
              }`}
            />
            {event.doors_open_at && (
              <InfoRow
                icon={Clock}
                main="Doors open"
                sub={formatTime(event.doors_open_at, tz)}
              />
            )}
            <InfoRow
              icon={event.is_online ? Video : MapPin}
              main={
                event.is_online ? (
                  "Online event"
                ) : event.venue ? (
                  <Link href={`/venues/${event.venue.slug}`} className="hover:underline">
                    {event.venue.name}
                  </Link>
                ) : (
                  "Venue to be announced"
                )
              }
              sub={
                event.is_online
                  ? "A joining link is sent with your ticket"
                  : [event.venue?.city, event.venue?.country].filter(Boolean).join(", ") || undefined
              }
            />
            {attendeeCount > 0 && (
              <InfoRow
                icon={Users}
                main="Going"
                sub={pluralize(attendeeCount, "person", "people")}
              />
            )}
          </div>

          {/* ---- Tickets ---------------------------------------------------- */}
          <section className="mt-10 scroll-mt-20" id="tickets">
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <h2 className="display-3 text-ink">Tickets</h2>
              {!soldOut && !isPast && !isCancelled && (
                <span className="text-sm text-ink-3 tabular">
                  {pluralize(totalLeft, "ticket")} left
                </span>
              )}
            </div>

            {isCancelled ? (
              <Card inset className="p-5 text-center">
                <p className="text-base font-medium text-ink">This event was cancelled</p>
                {event.cancellation_reason && (
                  <p className="mt-1 text-sm text-ink-3">{event.cancellation_reason}</p>
                )}
              </Card>
            ) : isPast ? (
              <Card inset className="p-5 text-center">
                <p className="text-base font-medium text-ink">This event has finished</p>
                <p className="mt-1 text-sm text-ink-3">
                  Follow {event.organizer?.name} to hear about the next one.
                </p>
              </Card>
            ) : event.seating_type === "reserved_seating" ? (
              // Seats and any unseated tiers are bought together: a second
              // reservation on the same event replaces the first, so two
              // separate baskets here would silently drop the buyer's seats.
              <SeatMap
                eventId={event.id}
                seats={seats}
                availability={seatedAvailability}
                generalAdmission={generalAvailability}
                signedIn={Boolean(user)}
              />
            ) : (
              <TicketPicker
                eventId={event.id}
                availability={availability}
                signedIn={Boolean(user)}
              />
            )}
          </section>

          {/* ---- About ------------------------------------------------------ */}
          {event.description && (
            <section className="mt-12">
              <h2 className="display-3 mb-4 text-ink">About this event</h2>
              <div className="space-y-4 text-md leading-[1.75] text-ink-2">
                {event.description.split("\n").filter(Boolean).map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </section>
          )}

          {event.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {event.tags.map((tag) => (
                <Link key={tag} href={`/events?q=${encodeURIComponent(tag)}`}>
                  <Badge tone="neutral" size="md" className="transition-colors hover:bg-sunken-2">
                    #{tag}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          {(event.refund_policy || event.terms) && (
            <section className="mt-12">
              <h2 className="display-3 mb-4 text-ink">Good to know</h2>
              <Card className="overflow-hidden">
                {event.refund_policy && (
                  <FieldRow icon={Ticket} label="Refund policy" value={event.refund_policy} align="start" />
                )}
                {event.terms && (
                  <FieldRow icon={ShieldCheck} label="Terms" value={event.terms} align="start" />
                )}
              </Card>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
