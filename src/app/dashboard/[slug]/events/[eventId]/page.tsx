import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ExternalLink, Eye, Ticket, TicketCheck, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireOrganizer } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/surface";
import { Meter, StatTile } from "@/components/ui/misc";
import { TicketTypeEditor } from "@/components/dashboard/ticket-type-editor";
import { EventStatusControl } from "@/components/dashboard/event-status-control";
import { formatDateTime, formatMoney, formatNumber } from "@/lib/format";
import type { EventStats, EventStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Manage event" };

const STATUS_TONE: Record<EventStatus, "positive" | "caution" | "neutral" | "critical"> = {
  published: "positive",
  draft: "neutral",
  pending_review: "caution",
  paused: "caution",
  cancelled: "critical",
  completed: "neutral",
};

export default async function ManageEventPage({
  params,
}: {
  params: Promise<{ slug: string; eventId: string }>;
}) {
  const { slug, eventId } = await params;
  const { organizer, role } = await requireOrganizer(slug, "scanner");
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("*, venue:venues(name, city), category:categories(name)")
    .eq("id", eventId)
    .eq("organizer_id", organizer.id)
    .maybeSingle();

  if (!event) notFound();

  const [{ data: statsData }, { data: ticketTypes }] = await Promise.all([
    supabase.rpc("event_stats", { p_event_id: eventId }),
    supabase.from("ticket_types").select("*").eq("event_id", eventId).order("sort_order"),
  ]);

  const stats = (statsData ?? {}) as unknown as EventStats;
  const canEdit = role === "owner" || role === "admin" || role === "staff";
  const currency = ticketTypes?.[0]?.currency ?? "USD";

  return (
    <div className="space-y-6">
      <Link
        href={`/dashboard/${slug}/events`}
        className="inline-flex items-center gap-1.5 text-[13px] text-ink-3 transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" />
        Events
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="display-3 text-ink">{event.title}</h1>
            <Badge tone={STATUS_TONE[event.status]} size="md">
              {event.status.replace("_", " ")}
            </Badge>
          </div>
          <p className="mt-2 text-[13.5px] text-ink-3">
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
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/${slug}/events/${eventId}/edit`}>Edit details</Link>
            </Button>
          )}
          {canEdit && <EventStatusControl eventId={eventId} status={event.status} />}
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
            <p className="text-[13.5px] text-ink-3">No ticket types yet.</p>
          ) : (
            (stats.by_ticket_type ?? []).map((tier) => (
              <div key={tier.name}>
                <div className="flex items-baseline justify-between gap-4 text-[13.5px]">
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
          ticketTypes={ticketTypes ?? []}
          seatingType={event.seating_type}
        />
      )}
    </div>
  );
}
