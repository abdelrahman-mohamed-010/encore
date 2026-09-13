import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TableEmptyRow, TableFooterPagination } from "@/components/ui/table";
import { ATTENDEE_COLUMNS } from "@/features/dashboard/table-columns";
import {
  listOrganizerAttendees,
  type DashboardAttendeeItem,
} from "@/features/dashboard/queries";
import { formatDateTime } from "@/lib/format";

export type { DashboardAttendeeItem };

const ATTENDEES_COLUMN_COUNT = ATTENDEE_COLUMNS.length;

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

  const {
    rows: tickets,
    total,
    totalPages,
  } = await listOrganizerAttendees({ eventIds: scoped, query, statusFilter, page, pageSize });

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
            <td data-cell="primary" className="px-5 py-3.5">
              <p className="truncate font-medium text-ink">{ticket.attendee_name ?? "—"}</p>
              <p className="truncate text-xs text-ink-3">{ticket.attendee_email ?? ""}</p>
            </td>

            <td data-label="Event" className="max-w-40 truncate px-5 py-3.5 text-ink-2">{ticket.event?.title ?? "—"}</td>

            <td data-label="Ticket" className="px-5 py-3.5 text-ink-2">
              {ticket.ticket_type?.name ?? "General"}
              {ticket.seat_label && (
                <span className="block text-xs text-ink-3">Seat {ticket.seat_label}</span>
              )}
            </td>

            <td data-label="Code" className="px-5 py-3.5 font-mono text-xs text-ink-2 font-medium">{ticket.ticket_code}</td>

            <td data-label="Status" className="px-5 py-3.5">
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
      <TableFooterPagination
        columns={ATTENDEES_COLUMN_COUNT}
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
      />
    </>
  );
}
