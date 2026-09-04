import type { Metadata } from "next";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireOrganizer } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card, SectionHeader } from "@/components/ui/surface";
import { EmptyState } from "@/components/ui/misc";
import { QuerySelect } from "@/components/ui/query-select";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Attendees" };

export default async function AttendeesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ event?: string }>;
}) {
  const { slug } = await params;
  const { event: eventFilter } = await searchParams;
  const { organizer } = await requireOrganizer(slug, "scanner");
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("events")
    .select("id, title")
    .eq("organizer_id", organizer.id)
    .order("starts_at", { ascending: false });

  const eventIds = (events ?? []).map((e) => e.id);
  const scoped = eventFilter && eventIds.includes(eventFilter) ? [eventFilter] : eventIds;

  const { data: tickets } = eventIds.length
    ? await supabase
        .from("tickets")
        .select(
          `id, ticket_code, attendee_name, attendee_email, seat_label, status, checked_in_at,
           ticket_type:ticket_types(name),
           event:events(title)`,
        )
        .in("event_id", scoped)
        .order("issued_at", { ascending: false })
        .limit(500)
    : { data: [] };

  const rows = tickets ?? [];
  const checkedIn = rows.filter((t) => t.status === "used").length;

  return (
    <div className="space-y-6">
      <SectionHeader
        level={1}
        title="Attendees"
        description={`${rows.length} tickets issued · ${checkedIn} checked in`}
        action={
          <QuerySelect
            param="event"
            label="Filter by event"
            allLabel="All events"
            className="w-56"
            value={eventFilter ?? ""}
            options={(events ?? []).map((event) => ({ value: event.id, label: event.title }))}
          />
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No attendees yet"
          description="Once tickets are sold, everyone appears here with their check-in state."
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[48rem] text-left text-[13px]">
            <thead>
              <tr className="border-b border-hairline text-[11.5px] uppercase tracking-[0.06em] text-ink-3">
                <th scope="col" className="px-4 py-3 font-semibold">Attendee</th>
                <th scope="col" className="px-4 py-3 font-semibold">Event</th>
                <th scope="col" className="px-4 py-3 font-semibold">Ticket</th>
                <th scope="col" className="px-4 py-3 font-semibold">Code</th>
                <th scope="col" className="px-4 py-3 font-semibold">Check-in</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((ticket) => (
                <tr key={ticket.id} className="border-b border-hairline-soft last:border-b-0 hover:bg-sunken">
                  <td className="px-4 py-3">
                    <p className="truncate text-ink">{ticket.attendee_name ?? "—"}</p>
                    <p className="truncate text-[12px] text-ink-3">{ticket.attendee_email ?? ""}</p>
                  </td>
                  <td className="max-w-40 truncate px-4 py-3 text-ink-2">{ticket.event?.title}</td>
                  <td className="px-4 py-3 text-ink-2">
                    {ticket.ticket_type?.name}
                    {ticket.seat_label && (
                      <span className="block text-[12px] text-ink-3">{ticket.seat_label}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-[12.5px] text-ink-2">{ticket.ticket_code}</td>
                  <td className="px-4 py-3">
                    {ticket.status === "used" ? (
                      <div>
                        <Badge tone="positive" size="xs">Checked in</Badge>
                        {ticket.checked_in_at && (
                          <span className="mt-1 block text-[11.5px] text-ink-3">
                            {formatDateTime(ticket.checked_in_at)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <Badge tone={ticket.status === "valid" ? "neutral" : "critical"} size="xs">
                        {ticket.status === "valid" ? "Not scanned" : ticket.status}
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
