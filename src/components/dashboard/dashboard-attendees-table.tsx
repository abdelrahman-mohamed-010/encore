"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/surface";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/misc";
import { TablePagination, useTablePagination } from "@/components/ui/table";
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

export function DashboardAttendeesTable({
  tickets,
  events,
  initialEventFilter,
  slug,
}: {
  tickets: DashboardAttendeeItem[];
  events: { id: string; title: string }[];
  initialEventFilter?: string;
  slug?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [eventFilter, setEventFilter] = React.useState<string>(initialEventFilter ?? "all");

  const filteredTickets = React.useMemo(() => {
    return tickets.filter((t) => {
      const q = query.toLowerCase().trim();
      const matchesQuery =
        !q ||
        (t.attendee_name && t.attendee_name.toLowerCase().includes(q)) ||
        (t.attendee_email && t.attendee_email.toLowerCase().includes(q)) ||
        t.ticket_code.toLowerCase().includes(q) ||
        (t.event?.title && t.event.title.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "checked_in" && t.status === "used") ||
        (statusFilter === "not_scanned" && t.status === "valid");

      return matchesQuery && matchesStatus;
    });
  }, [tickets, query, statusFilter]);

  const {
    paginatedItems,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    setPage,
    setPageSize,
  } = useTablePagination(filteredTickets, 15);

  return (
    <div className="space-y-4">
      {/* Controls Bar with matching SelectField design */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-56 max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by attendee, email, or code..."
              className="pl-9"
              aria-label="Search attendees"
            />
          </div>

          <SelectField
            value={eventFilter}
            onChange={(val) => {
              setEventFilter(val);
              if (slug) {
                router.push(val === "all" ? `/dashboard/${slug}/attendees` : `/dashboard/${slug}/attendees?event=${val}`);
              }
            }}
            aria-label="Filter attendees by event"
            className="w-48"
            options={[
              { value: "all", label: "All events" },
              ...events.map((e) => ({ value: e.id, label: e.title })),
            ]}
          />

          <SelectField
            value={statusFilter}
            onChange={setStatusFilter}
            aria-label="Filter attendees by check-in status"
            className="w-40"
            options={[
              { value: "all", label: "All check-ins" },
              { value: "checked_in", label: "Checked in" },
              { value: "not_scanned", label: "Not scanned" },
            ]}
          />
        </div>
      </div>

      {filteredTickets.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No attendees found"
          description={
            tickets.length === 0
              ? "Once tickets are sold, attendees will appear here with their check-in state."
              : "Try adjusting your search or status filter."
          }
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead>
              <tr className="border-b border-hairline text-2xs uppercase tracking-[0.06em] text-ink-3">
                <th scope="col" className="px-4 py-3 font-semibold">Attendee</th>
                <th scope="col" className="px-4 py-3 font-semibold">Event</th>
                <th scope="col" className="px-4 py-3 font-semibold">Ticket Type</th>
                <th scope="col" className="px-4 py-3 font-semibold">Ticket Code</th>
                <th scope="col" className="px-4 py-3 font-semibold">Check-in Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="border-b border-hairline-soft last:border-b-0 hover:bg-sunken transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="truncate font-medium text-ink">{ticket.attendee_name ?? "—"}</p>
                    <p className="truncate text-xs text-ink-3">{ticket.attendee_email ?? ""}</p>
                  </td>

                  <td className="max-w-40 truncate px-4 py-3 text-ink-2">
                    {ticket.event?.title ?? "—"}
                  </td>

                  <td className="px-4 py-3 text-ink-2">
                    {ticket.ticket_type?.name ?? "General"}
                    {ticket.seat_label && (
                      <span className="block text-xs text-ink-3">Seat {ticket.seat_label}</span>
                    )}
                  </td>

                  <td className="px-4 py-3 font-mono text-xs text-ink-2 font-medium">
                    {ticket.ticket_code}
                  </td>

                  <td className="px-4 py-3">
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
          </table>

          {/* Table Pagination */}
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </Card>
      )}
    </div>
  );
}
