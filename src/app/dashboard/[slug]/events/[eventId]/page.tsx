import Link from "next/link";
import { EventStatusBadge } from "@/components/ui/status-badge";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ExternalLink, Eye, Ticket, TicketCheck, Wallet } from "lucide-react";
import { getEventDetail } from "@/features/events/queries";
import { requireOrganizer } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/surface";

import { Meter } from "@/components/ui/meter";
import { StatTile } from "@/components/ui/stat-tile";
import { TicketTypeEditor } from "@/features/events/components/ticket-type-editor";
import { SeatingEditor, type SeatingSection } from "@/features/seating/components/seating-editor";
import { EventStatusControl } from "@/features/events/components/event-status-control";
import { EventFormDrawer } from "@/features/events/components/event-form-drawer";
import { formatDateTime, formatMoney, formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Manage event" };

export default async function ManageEventPage({
  params,
}: {
  params: Promise<{ slug: string; eventId: string }>;
}) {
  const { slug, eventId } = await params;
  const { organizer, role } = await requireOrganizer(slug, "scanner");
  const detail = await getEventDetail(eventId, organizer.id);
  if (!detail) notFound();

  const { event, stats, ticketTypes, venueSections, soldOrHeld } = detail;

  const sections: SeatingSection[] = venueSections.map((section) => ({
    id: section.id,
    name: section.name,
    color: section.color,
    seats: section.venue_seats?.[0]?.count ?? 0,
  }));
  const canEdit = role === "owner" || role === "admin" || role === "staff";
  const currency = ticketTypes?.[0]?.currency ?? "USD";

  return (
    <div className="space-y-6 px-5 md:px-8">
      <Link
        href={`/dashboard/${slug}/events`}
        className="inline-flex items-center gap-1.5 text-sm text-ink-3 transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" />
        Events
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="display-3 text-ink">{event.title}</h1>
            <EventStatusBadge status={event.status} size="xs" />
          </div>
          <p className="mt-2 text-sm text-ink-3">
            {formatDateTime(event.starts_at, event.timezone ?? undefined)}
            {event.venue && ` · ${event.venue.name}`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {event.status === "published" && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/events/${event.slug}`} target="_blank">
                View live <ExternalLink />
              </Link>
            </Button>
          )}
          {canEdit && (
            <EventFormDrawer
              organizerId={organizer.id}
              organizerSlug={slug}
              event={event}
              trigger={<Button variant="outline" size="sm">Edit details</Button>}
            />
          )}
          {canEdit && (
            <EventStatusControl eventId={eventId} organizerSlug={slug} status={event.status} />
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Gross revenue"
          value={formatMoney(stats.gross_cents ?? 0, currency)}
          sub={`${formatNumber(stats.orders ?? 0)} orders`}
          icon={Wallet}
        />
        <StatTile
          label="Tickets sold"
          value={formatNumber(stats.tickets_sold ?? 0)}
          sub={`of ${formatNumber(stats.capacity ?? 0)} capacity`}
          icon={Ticket}
        />
        <StatTile
          label="Checked in"
          value={formatNumber(stats.tickets_checked_in ?? 0)}
          sub={
            stats.tickets_sold
              ? `${Math.round(((stats.tickets_checked_in ?? 0) / stats.tickets_sold) * 100)}% of sold`
              : "No sales yet"
          }
          icon={TicketCheck}
        />
        <StatTile
          label="Page views"
          value={formatNumber(stats.views ?? 0)}
          sub="Since publishing"
          icon={Eye}
        />
      </div>

      <Card>
        <CardHeader bordered>
          <CardTitle>Sales by ticket type</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          {(stats.by_ticket_type ?? []).length === 0 ? (
            <p className="text-sm text-ink-3">No ticket types yet.</p>
          ) : (
            (stats.by_ticket_type ?? []).map((tier) => (
              <div key={tier.name}>
                <div className="flex items-baseline justify-between gap-4 text-sm">
                  <span className="font-medium text-ink">{tier.name}</span>
                  <span className="tabular text-ink-2">
                    {formatNumber(tier.sold)} / {formatNumber(tier.total)} ·{" "}
                    <span className="font-semibold text-ink">
                      {formatMoney(tier.gross_cents, currency)}
                    </span>
                  </span>
                </div>
                <Meter value={tier.sold} max={tier.total || 1} className="mt-2" />
              </div>
            ))
          )}
        </CardBody>
      </Card>

      {canEdit && (
        <TicketTypeEditor
          eventId={eventId}
          organizerSlug={slug}
          ticketTypes={ticketTypes ?? []}
          seatingType={event.seating_type}
          sections={sections}
        />
      )}

      {canEdit && (
        <SeatingEditor
          eventId={eventId}
          organizerSlug={slug}
          seatingType={event.seating_type}
          venue={event.venue ? { id: event.venue.id, name: event.venue.name } : null}
          sections={sections}
          ticketTypeCount={ticketTypes?.length ?? 0}
          soldOrHeld={soldOrHeld ?? 0}
        />
      )}
    </div>
  );
}
