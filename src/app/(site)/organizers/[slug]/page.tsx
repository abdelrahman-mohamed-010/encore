import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { format } from "date-fns";
import { ArrowRight, Calendar, Clock, Globe, Mail, MapPin, ShieldCheck, Ticket } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, EmptyState } from "@/components/ui/misc";
import { NearbyEvents } from "@/components/map/nearby-events";
import { Badge } from "@/components/ui/badge";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { formatMoney } from "@/lib/format";
import type { EventSearchResult } from "@/lib/types";

export const revalidate = 120;

async function loadOrganizer(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organizers")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const organizer = await loadOrganizer(slug);
  if (!organizer) return { title: "Organizer not found" };
  const description = organizer.description ?? `Events by ${organizer.name} on Encore.`;
  return {
    title: organizer.name,
    description,
    openGraph: {
      title: organizer.name,
      description,
      type: "profile",
      images: organizer.logo_url ? [organizer.logo_url] : undefined,
    },
  };
}

export default async function OrganizerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const organizer = await loadOrganizer(slug);
  if (!organizer) notFound();

  const supabase = await createClient();
  const [{ data: events }, { data: ownerRows }] = await Promise.all([
    supabase.rpc("search_events", { p_organizer_slug: slug, p_limit: 50 }),
    supabase.from("public_profiles").select("id, full_name").eq("id", organizer.owner_id).limit(1),
  ]);

  const rows = (events ?? []) as EventSearchResult[];
  const owner = ownerRows?.[0] ?? null;

  // Group events by day for the Convene timeline view
  const groupedEvents: Record<string, EventSearchResult[]> = {};
  for (const event of rows) {
    const dayKey = event.starts_at ? format(new Date(event.starts_at), "yyyy-MM-dd") : "tba";
    if (!groupedEvents[dayKey]) groupedEvents[dayKey] = [];
    groupedEvents[dayKey].push(event);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: organizer.name,
    description: organizer.description ?? undefined,
    logo: organizer.logo_url ?? undefined,
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/organizers/${slug}`,
    sameAs: organizer.website ? [organizer.website] : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Banner */}
      <div className="relative h-44 bg-sunken md:h-64">
        {organizer.banner_url ? (
          <Image src={organizer.banner_url} alt="" fill sizes="100vw" className="object-cover" priority />
        ) : (
          <div className="size-full bg-gradient-to-r from-sunken via-sunken-2 to-sunken" />
        )}
      </div>

      <div className="container-page pb-16">
        {/* Organizer Identity Bar */}
        <div className="relative -mt-12 flex flex-wrap items-end justify-between gap-6 pb-6 border-b border-hairline md:-mt-16">
          <div className="flex flex-wrap items-end gap-5">
            <Avatar
              src={organizer.logo_url}
              name={organizer.name}
              size="xl"
              className="size-24 rounded-2xl border-4 border-paper shadow-md md:size-28"
            />
            <div className="min-w-0 pb-1">
              <h1 className="display-2 flex flex-wrap items-center gap-2.5 text-ink">
                {organizer.name}
                {organizer.verification_status === "verified" && (
                  <VerifiedBadge size="md" showLabel />
                )}
              </h1>
              {owner?.full_name && (
                <p className="mt-1 text-sm text-ink-3">
                  Hosted by{" "}
                  <Link href={`/u/${organizer.owner_id}`} className="font-medium text-ink-2 hover:underline">
                    {owner.full_name}
                  </Link>
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {organizer.website && (
              <a
                href={organizer.website}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-card px-3.5 py-2 text-xs font-semibold text-ink-2 shadow-xs transition-colors hover:bg-sunken hover:text-ink"
              >
                <Globe className="size-3.5" />
                {organizer.website.replace(/^https?:\/\//, "")}
              </a>
            )}
            {organizer.support_email && (
              <a
                href={`mailto:${organizer.support_email}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-card px-3.5 py-2 text-xs font-semibold text-ink-2 shadow-xs transition-colors hover:bg-sunken hover:text-ink"
              >
                <Mail className="size-3.5" />
                Contact
              </a>
            )}
          </div>
        </div>

        {organizer.description && (
          <p className="mt-6 max-w-3xl text-md leading-relaxed text-ink-2">
            {organizer.description}
          </p>
        )}

        {/* Convene Style Timeline Events Section */}
        <div className="mt-12">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="display-3 text-ink">Events Schedule</h2>
            <Badge tone="neutral" size="sm" className="rounded-full">
              <Calendar className="mr-1 size-3" />
              {rows.length} upcoming
            </Badge>
          </div>

          {rows.length === 0 ? (
            <EmptyState
              className="mt-6"
              title="Nothing on sale right now"
              description={`Check back soon for the next ${organizer.name} experience.`}
            />
          ) : (
            <div className="relative pl-6 sm:pl-8 before:absolute before:bottom-3 before:left-2 before:top-3 before:w-0.5 before:bg-hairline">
              {Object.entries(groupedEvents).map(([dayKey, dayEvents]) => {
                const dateObj = dayKey !== "tba" ? new Date(dayEvents[0].starts_at) : null;
                const monthDay = dateObj ? format(dateObj, "MMM d") : "Dates TBA";
                const weekday = dateObj ? format(dateObj, "EEEE") : "";

                return (
                  <div key={dayKey} className="relative mb-10 last:mb-0">
                    {/* Timeline Node Dot — centered on the rail (before:left-2 + half its
                        w-0.5), not just nudged left by the row's own padding. */}
                    <span className="absolute -left-3.75 top-1.5 size-3 -translate-x-1/2 rounded-full border-2 border-paper bg-line-2 shadow-xs sm:-left-5.75" />

                    {/* Day Header */}
                    <div className="mb-4 flex items-baseline gap-2">
                      <h3 className="text-lg font-bold text-ink">{monthDay}</h3>
                      {weekday && <span className="text-sm font-medium text-ink-3">{weekday}</span>}
                    </div>

                    {/* Events for this day */}
                    <div className="space-y-4">
                      {dayEvents.map((event) => {
                        const timeString = event.starts_at ? format(new Date(event.starts_at), "h:mm a") : "";
                        const locationLabel = event.is_online
                          ? "Online event"
                          : [event.venue_name, event.city].filter(Boolean).join(" · ") || "Venue TBA";

                        return (
                          <Link
                            key={event.id}
                            href={`/events/${event.slug}`}
                            className="group flex flex-col justify-between gap-4 overflow-hidden rounded-2xl bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 sm:flex-row sm:items-center"
                          >
                            {/* Event Info */}
                            <div className="flex min-w-0 flex-1 flex-col justify-center">
                              {timeString && (
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber">
                                  <Clock className="size-3.5" />
                                  <span>{timeString}</span>
                                </div>
                              )}

                              <h4 className="mt-1.5 text-lg font-bold text-ink transition-colors group-hover:text-brand-600 sm:text-xl">
                                {event.title}
                              </h4>

                              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-2">
                                <span className="flex items-center gap-1">
                                  <MapPin className="size-3.5 text-ink-3" />
                                  <span className="truncate">{locationLabel}</span>
                                </span>
                              </div>

                              <div className="mt-3 flex items-center gap-2">
                                <span className="inline-flex items-center rounded-lg bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700 dark:bg-green-950/50 dark:text-green-300">
                                  {event.min_price_cents === 0
                                    ? "Free"
                                    : event.min_price_cents
                                      ? `From ${formatMoney(event.min_price_cents, event.currency)}`
                                      : "On sale"}
                                </span>
                              </div>
                            </div>

                            {/* Event Poster / Thumbnail */}
                            <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-xl bg-sunken sm:h-28 sm:w-28">
                              {event.cover_image_url ? (
                                <Image
                                  src={event.cover_image_url}
                                  alt={event.title}
                                  fill
                                  sizes="(max-width: 640px) 100vw, 112px"
                                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                              ) : (
                                <div className="flex size-full items-center justify-center bg-gradient-to-br from-sunken to-sunken-2 text-ink-3">
                                  <Ticket className="size-8 opacity-40" />
                                </div>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Nearby Events */}
        <NearbyEvents organizerSlug={slug} organizerName={organizer.name} />
      </div>
    </>
  );
}
