import Image from "next/image";
import { EventStatusBadge } from "@/components/ui/status-badge";
import Link from "next/link";
import { Search, Ticket } from "lucide-react";
import { TableEmptyRow, TableFooterPagination } from "@/components/ui/table";
import { EVENT_REVIEW_COLUMNS } from "@/features/admin/table-columns";
import { listEventsForReview } from "@/features/admin/queries";
import { formatDate } from "@/lib/format";
import { EventReviewActions } from "@/features/admin/components/event-review-actions";

const EVENT_REVIEW_COLUMN_COUNT = EVENT_REVIEW_COLUMNS.length;

export async function EventReviewRows({
  query,
  status,
  page,
  pageSize,
}: {
  query?: string;
  status?: string;
  page: number;
  pageSize: number;
}) {
  const { rows, total, totalPages } = await listEventsForReview({ query, status, page, pageSize });

  const events = rows.map((event) => ({
    id: event.id,
    title: event.title,
    slug: event.slug,
    status: event.status,
    startsAt: event.starts_at,
    coverImageUrl: event.cover_image_url,
    organizerName: event.organizer?.name ?? "",
    venueLabel: [event.venue?.name, event.venue?.city].filter(Boolean).join(" · "),
    tiers: (event.ticket_types ?? []).length,
  }));

  if (events.length === 0) {
    return (
      <TableEmptyRow
        icon={Search}
        columns={EVENT_REVIEW_COLUMN_COUNT}
        title="No events found"
        description="Try a different search term or filter."
      />
    );
  }

  return (
    <>
      <tbody>
        {events.map((event) => (
          <tr key={event.id} className="border-b border-hairline-soft last:border-b-0 hover:bg-sunken">
            <td data-cell="primary" className="px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-sunken flex items-center justify-center">
                  {event.coverImageUrl ? (
                    <Image src={event.coverImageUrl} alt="" fill sizes="40px" className="object-cover" />
                  ) : (
                    <Ticket className="size-4 text-ink-3" />
                  )}
                </div>
                <div className="min-w-0">
                  <Link
                    href={`/events/${event.slug}`}
                    target="_blank"
                    className="truncate text-ink font-medium hover:underline block"
                  >
                    {event.title}
                  </Link>
                  <p className="truncate text-xs text-ink-3">{event.venueLabel || "No venue"}</p>
                </div>
              </div>
            </td>
            <td data-label="Starts" className="whitespace-nowrap px-5 py-3.5 text-ink-3">
              {formatDate(event.startsAt, "medium")}
            </td>
            <td data-label="Organizer" className="whitespace-nowrap px-5 py-3.5 text-ink-3">{event.organizerName || "—"}</td>
            <td data-label="Status" className="px-5 py-3.5">
              <EventStatusBadge status={event.status} size="xs" />
            </td>
            <td data-cell="actions" className="px-5 py-3.5 text-right">
              <EventReviewActions
                id={event.id}
                title={event.title}
                slug={event.slug}
                status={event.status}
                tiers={event.tiers}
              />
            </td>
          </tr>
        ))}
      </tbody>
      <TableFooterPagination
        columns={EVENT_REVIEW_COLUMN_COUNT}
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
      />
    </>
  );
}
