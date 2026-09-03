import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  CalendarDays, Clock, Globe, MapPin, ShieldCheck, Tag, Ticket, Users, Video,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/misc";
import { Card, Divider } from "@/components/ui/surface";
import { FieldRow } from "@/components/ui/field-row";
import { TicketPicker } from "@/components/events/ticket-picker";
import { SeatMap } from "@/components/events/seat-map";
import { FavoriteButton } from "@/components/events/favorite-button";
import { ShareButton } from "@/components/events/share-button";
import { formatDate, formatTime, pluralize } from "@/lib/format";
import type { EventSeat, TicketAvailability, VenueSeat, VenueSection } from "@/lib/types";

type SeatWithPlace = EventSeat & {
  seat: (Pick<VenueSeat, "id" | "row_label" | "seat_number" | "pos_x" | "pos_y"> & {
    section: Pick<VenueSection, "id" | "name" | "code" | "color"> | null;
  }) | null;
};

async function loadEvent(slug: string) {
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

  const [{ data: availability }, { data: seats }] = await Promise.all([
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
  ]);

  return {
    event,
    availability: (availability ?? []) as TicketAvailability[],
    seats: (seats ?? []) as unknown as SeatWithPlace[],
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const loaded = await loadEvent(slug);
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
  const loaded = await loadEvent(slug);
  if (!loaded) notFound();

  const { event, availability, seats } = loaded;
  const user = await getUser();
  const supabase = await createClient();

  const [{ data: favorite }, { count: attendeeCount }] = await Promise.all([
    user
      ? supabase.from("favorites").select("event_id").eq("event_id", event.id).eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("tickets").select("id", { count: "exact", head: true }).eq("event_id", event.id).in("status", ["valid", "used"]),
  ]);

  const tz = event.timezone ?? undefined;
  const isPast = new Date(event.ends_at) < new Date();
  const isCancelled = event.status === "cancelled";
  const totalLeft = availability.reduce((sum, t) => sum + t.available, 0);
  const soldOut = totalLeft <= 0;

  return (
    <div className="container-page py-8 md:py-12">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-14">
        {/* ---- Left rail: poster, organizer, venue ------------------------- */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-hairline bg-sunken">
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
              <div className="size-full bg-gradient-to-br from-n-100 to-n-200 dark:from-n-800 dark:to-n-900" />
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
                  <p className="flex items-center gap-1.5 truncate text-[14px] font-medium text-ink">
                    {event.organizer?.name}
                    {event.organizer?.verification_status === "verified" && (
                      <ShieldCheck className="size-3.5 shrink-0 text-info" />
                    )}
                  </p>
                  <p className="truncate text-[12.5px] text-ink-3">View all events</p>
                </div>
              </Link>
            </div>

            {event.venue && !event.is_online && (
              <>
                <Divider />
                <div>
                  <p className="eyebrow mb-2.5">Venue</p>
                  <p className="text-[14px] font-medium text-ink">{event.venue.name}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-3">
                    {[event.venue.address_line1, event.venue.city, event.venue.country]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  {event.venue.latitude && event.venue.longitude && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${event.venue.latitude},${event.venue.longitude}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-2 inline-block text-[13px] font-medium text-accent-600 hover:underline dark:text-accent-400"
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
                initialFavorited={Boolean(favorite)}
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
              <Badge tone="neutral" size="md" pill>
                <Tag className="size-3" />
                {event.category.name}
              </Badge>
            )}
            {event.is_featured && <Badge tone="solid" size="md" pill>Featured</Badge>}
            {isCancelled && <Badge tone="critical" size="md" pill>Cancelled</Badge>}
            {!isCancelled && soldOut && <Badge tone="critical" size="md" pill>Sold out</Badge>}
            {event.min_age ? <Badge tone="outline" size="md" pill>{event.min_age}+</Badge> : null}
          </div>

          <h1 className="display-1 mt-4 text-ink">{event.title}</h1>
          {event.subtitle && (
            <p className="mt-3 text-[17px] leading-relaxed text-ink-2">{event.subtitle}</p>
          )}

          <Card className="mt-7 overflow-hidden">
            <FieldRow
              icon={CalendarDays}
              label={formatDate(event.starts_at, "full", tz)}
              value={`${formatTime(event.starts_at, tz)} – ${formatTime(event.ends_at, tz)}`}
            />
            {event.doors_open_at && (
              <FieldRow
                icon={Clock}
                label="Doors open"
                value={formatTime(event.doors_open_at, tz)}
              />
            )}
            <FieldRow
              icon={event.is_online ? Video : MapPin}
              label={event.is_online ? "Online event" : event.venue?.name ?? "Venue to be announced"}
              value={
                event.is_online
                  ? "A joining link is sent with your ticket"
                  : [event.venue?.city, event.venue?.country].filter(Boolean).join(", ") || undefined
              }
            />
            {tz && (
              <FieldRow icon={Globe} label="Timezone" value={tz.replace("_", " ")} />
            )}
            {(attendeeCount ?? 0) > 0 && (
              <FieldRow
                icon={Users}
                label="Going"
                value={pluralize(attendeeCount ?? 0, "person", "people")}
              />
            )}
          </Card>

          {/* ---- Tickets ---------------------------------------------------- */}
          <section className="mt-10 scroll-mt-20" id="tickets">
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <h2 className="display-3 text-ink">Tickets</h2>
              {!soldOut && !isPast && !isCancelled && (
                <span className="text-[13px] text-ink-3 tabular">
                  {pluralize(totalLeft, "ticket")} left
                </span>
              )}
            </div>

            {isCancelled ? (
              <Card inset className="p-5 text-center">
                <p className="text-[14px] font-medium text-ink">This event was cancelled</p>
                {event.cancellation_reason && (
                  <p className="mt-1 text-[13px] text-ink-3">{event.cancellation_reason}</p>
                )}
              </Card>
            ) : isPast ? (
              <Card inset className="p-5 text-center">
                <p className="text-[14px] font-medium text-ink">This event has finished</p>
                <p className="mt-1 text-[13px] text-ink-3">
                  Follow {event.organizer?.name} to hear about the next one.
                </p>
              </Card>
            ) : event.seating_type === "reserved_seating" ? (
              <SeatMap
                eventId={event.id}
                seats={seats}
                availability={availability}
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
              <div className="space-y-4 text-[15px] leading-[1.75] text-ink-2">
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
                  <Badge tone="neutral" size="md" pill className="transition-colors hover:bg-n-150 dark:hover:bg-n-800">
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
