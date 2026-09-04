import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/misc";
import { Card } from "@/components/ui/surface";
import { DateBlock } from "@/components/ui/field-row";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import type { Functions } from "@/lib/types";

export const revalidate = 300;

type Params = { params: Promise<{ id: string }> };
type HostEvent = Functions["host_events"]["Returns"][number];

/** A uuid, or there is no such person — checked before it reaches the query. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadHost(id: string) {
  if (!UUID.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.rpc("host_profile", { p_id: id });
  return data?.[0] ?? null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const host = await loadHost(id);
  if (!host) return { title: "Host" };

  const name = host.full_name ?? "Host";
  return {
    title: name,
    description: host.bio ?? `Events hosted by ${name} on Tazkarti.`,
    openGraph: { title: name, images: host.avatar_url ? [host.avatar_url] : undefined },
  };
}

function EventRow({ event }: { event: HostEvent }) {
  return (
    <li>
      <Link
        href={`/events/${event.slug}`}
        className="flex items-start gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-sunken"
      >
        <DateBlock date={event.starts_at} timeZone={event.timezone ?? undefined} />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-ink-3">
            {formatDateTime(event.starts_at, event.timezone ?? undefined)}
          </p>
          <p className="mt-0.5 truncate text-base font-semibold text-ink">{event.title}</p>
          <p className="mt-0.5 truncate text-xs text-ink-3">
            By {event.organizer_name}
            {event.venue_name ? ` · ${event.venue_name}` : ""}
          </p>
        </div>
        {event.min_price_cents !== null && (
          <span className="shrink-0 text-sm font-medium tnum text-ink-2">
            {event.min_price_cents === 0
              ? "Free"
              : formatMoney(event.min_price_cents, event.currency ?? "USD")}
          </span>
        )}
      </Link>
    </li>
  );
}

export default async function HostProfilePage({ params }: Params) {
  const { id } = await params;
  const host = await loadHost(id);
  if (!host) notFound();

  const supabase = await createClient();
  const [{ data: upcoming }, { data: past }] = await Promise.all([
    supabase.rpc("host_events", { p_id: id, p_past: false, p_limit: 12 }),
    supabase.rpc("host_events", { p_id: id, p_past: true, p_limit: 6 }),
  ]);

  const organizers = (host.organizers ?? []) as {
    slug: string;
    name: string;
    logo_url: string | null;
  }[];

  return (
    <div className="container-narrow py-12">
      <header className="flex flex-col items-center gap-5 text-center">
        <Avatar src={host.avatar_url} name={host.full_name ?? "Host"} size="xl" className="size-28" />

        <div className="space-y-2">
          <h1 className="display-3 text-ink">{host.full_name ?? "Host"}</h1>

          <p className="flex items-center justify-center gap-1.5 text-sm text-ink-3">
            <CalendarDays className="size-3.5" aria-hidden />
            Joined {formatDate(host.created_at, "long")}
          </p>

          <p className="flex items-center justify-center gap-4 text-base text-ink-2">
            <span>
              <strong className="font-semibold tnum text-ink">{host.hosted_count}</strong> Hosted
            </span>
            <span>
              <strong className="font-semibold tnum text-ink">{host.attended_count}</strong> Attended
            </span>
          </p>
        </div>

        {host.bio && (
          <p className="max-w-prose text-md leading-relaxed text-ink-2">{host.bio}</p>
        )}

        {organizers.length > 0 && (
          <ul data-testid="host-organizers" className="flex flex-wrap justify-center gap-2">
            {organizers.map((organizer) => (
              <li key={organizer.slug}>
                <Link
                  href={`/organizers/${organizer.slug}`}
                  className="flex items-center gap-2 rounded-lg bg-card shadow-e1 py-1.5 pl-1.5 pr-3 text-sm font-medium text-ink transition-colors hover:bg-sunken"
                >
                  <Avatar src={organizer.logo_url} name={organizer.name} size="sm" />
                  {organizer.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </header>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-ink">Hosting</h2>
        {upcoming && upcoming.length > 0 ? (
          <Card className="mt-4 p-1">
            <ul className="divide-y divide-hairline-soft">
              {upcoming.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </ul>
          </Card>
        ) : (
          <p className="mt-4 flex items-center gap-2 text-sm text-ink-3">
            <MapPin className="size-4" aria-hidden />
            Nothing coming up right now.
          </p>
        )}
      </section>

      {past && past.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-ink">Past events</h2>
          <Card className="mt-4 p-1">
            <ul className="divide-y divide-hairline-soft">
              {past.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </ul>
          </Card>
        </section>
      )}
    </div>
  );
}
