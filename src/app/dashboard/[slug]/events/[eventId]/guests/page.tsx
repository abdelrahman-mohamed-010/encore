import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireOrganizer } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/surface";
import { DashboardBody } from "@/components/dashboard/page-header";
import { PlainCard, SectionBlock } from "@/components/dashboard/tiles";
import { formatDateTime, pluralize } from "@/lib/format";

export const metadata: Metadata = { title: "Guests" };

const STATUS_TONE = {
  valid: "positive",
  used: "neutral",
  refunded: "caution",
  void: "critical",
  transferred: "neutral",
} as const;

export default async function GuestsPane({
  params,
}: {
  params: Promise<{ slug: string; eventId: string }>;
}) {
  const { slug, eventId } = await params;
  const { organizer } = await requireOrganizer(slug, "scanner");
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("organizer_id", organizer.id)
    .maybeSingle();

  if (!event) notFound();

  const { data: tickets } = await supabase
    .from("tickets")
    .select(
      `id, ticket_code, attendee_name, attendee_email, seat_label, status, checked_in_at,
       ticket_type:ticket_types(name)`,
    )
    .eq("event_id", eventId)
    .order("issued_at", { ascending: false })
    .limit(500);

  const rows = tickets ?? [];
  const checkedIn = rows.filter((t) => t.status === "used").length;

  return (
    <DashboardBody className="space-y-6">
      <SectionBlock
        title="Guests"
        description={
          rows.length
            ? `${pluralize(rows.length, "ticket")} issued · ${checkedIn} checked in`
            : undefined
        }
      >
        {rows.length === 0 ? (
          <PlainCard icon={Send} tone="blue" title="No guests yet">
            Share the event page to start collecting registrations.
          </PlainCard>
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead>
                <tr className="border-b border-hairline text-2xs uppercase tracking-[0.06em] text-ink-3">
                  <th scope="col" className="px-4 py-3 font-semibold">Guest</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Ticket</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Code</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Checked in</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-hairline-soft last:border-b-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{ticket.attendee_name ?? "—"}</p>
                      <p className="text-xs text-ink-2">{ticket.attendee_email ?? ""}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-2">
                      {ticket.ticket_type?.name ?? "—"}
                      {ticket.seat_label && (
                        <span className="block text-xs text-ink-3">{ticket.seat_label}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-2">
                      {ticket.ticket_code}
                    </td>
                    <td className="px-4 py-3 text-ink-2">
                      {ticket.checked_in_at ? formatDateTime(ticket.checked_in_at) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[ticket.status] ?? "neutral"} size="xs">
                        {ticket.status === "used" ? "Checked in" : ticket.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </SectionBlock>
    </DashboardBody>
  );
}
