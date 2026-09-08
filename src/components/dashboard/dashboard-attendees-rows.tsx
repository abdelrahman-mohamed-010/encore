import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PaginationRow, TableEmptyRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";

export type DashboardAttendeeItem = {
  id: string;
  ticket_code: string;
  attendee_name: string | null;
  attendee_email: string | null;
  seat_label: string | null;
  status: string;
  checked_in_at: string | null;
  ticket_type: { name: string } | null;
  event: { title: string } | null;
};

export const ATTENDEES_COLUMN_COUNT = 5;

export async function AttendeeRows({
  eventIds,
  eventFilter,
  query,
  statusFilter,
  page,
  pageSize,
}: {
  eventIds: string[];
  eventFilter?: string;
  query?: string;
  statusFilter?: string;
  page: number;
  pageSize: number;
}) {
  const supabase = await createClient();
  const scoped = eventFilter && eventFilter !== "all" && eventIds.includes(eventFilter) ? [eventFilter] : eventIds;

  if (scoped.length === 0) {
    return (
      <TableEmptyRow
        icon={Users}
        columns={ATTENDEES_COLUMN_COUNT}
        title="No attendees found"
        description="Once tickets are sold, attendees will appear here with their check-in state."
      />
    );
  }

  let dbQuery = supabase
    .from("tickets")
    .select(
      `id, ticket_code, attendee_name, attendee_email, seat_label, status, checked_in_at,
       ticket_type:ticket_types(name),
       event:events(title)`,
      { count: "exact" },
    )
    .in("event_id", scoped);

  if (statusFilter === "checked_in") dbQuery = dbQuery.eq("status", "used");
  else if (statusFilter === "not_scanned") dbQuery = dbQuery.eq("status", "valid");

  if (query?.trim()) {
    const term = `%${query.trim()}%`;
    dbQuery = dbQuery.or(`attendee_name.ilike.${term},attendee_email.ilike.${term},ticket_code.ilike.${term}`);
  }

  const from = (page - 1) * pageSize;
  const { data, count } = await dbQuery
    .order("issued_at", { ascending: false })
    .range(from, from + pageSize - 1);

  const tickets = (data ?? []) as unknown as DashboardAttendeeItem[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (tickets.length === 0) {
    return (
      <TableEmptyRow
        icon={Users}
        columns={ATTENDEES_COLUMN_COUNT}
        title="No attendees found"
        description="Try adjusting your search or status filter."
      />
    );
  }

  return (
    <>
      <tbody>
        {tickets.map((ticket) => (
          <tr
            key={ticket.id}
            className="border-b border-hairline-soft last:border-b-0 hover:bg-sunken transition-colors"
          >
            <td className="px-5 py-3.5">
              <p className="truncate font-medium text-ink">{ticket.attendee_name ?? "—"}</p>
              <p className="truncate text-xs text-ink-3">{ticket.attendee_email ?? ""}</p>
            </td>

            <td className="max-w-40 truncate px-5 py-3.5 text-ink-2">{ticket.event?.title ?? "—"}</td>

            <td className="px-5 py-3.5 text-ink-2">
              {ticket.ticket_type?.name ?? "General"}
              {ticket.seat_label && (
                <span className="block text-xs text-ink-3">Seat {ticket.seat_label}</span>
              )}
            </td>

            <td className="px-5 py-3.5 font-mono text-xs text-ink-2 font-medium">{ticket.ticket_code}</td>

            <td className="px-5 py-3.5">
              {ticket.status === "used" ? (
                <div>
                  <Badge tone="positive" size="xs">Checked in</Badge>
                  {ticket.checked_in_at && (
                    <span className="mt-1 block text-2xs text-ink-3">
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
      <tfoot>
        <tr>
          <td colSpan={ATTENDEES_COLUMN_COUNT} className="p-0">
            <PaginationRow page={page} totalPages={totalPages} total={total} pageSize={pageSize} />
          </td>
        </tr>
      </tfoot>
    </>
  );
}
