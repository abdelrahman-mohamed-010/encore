import Link from "next/link";
import { EventStatusBadge } from "@/components/ui/status-badge";
import Image from "next/image";
import { CalendarDays, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Meter } from "@/components/ui/misc";
import { Tooltip } from "@/components/ui/tooltip";
import { PaginationRow, RowLink, TableEmptyRow } from "@/components/ui/table";
import { listOrganizerEvents, type DashboardEventItem } from "@/features/dashboard/queries";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";

export type { DashboardEventItem };

export const EVENTS_COLUMN_COUNT = 7;

export async function EventsRows({
  organizerId,
  slug,
  query,
  status,
  page,
  pageSize,
}: {
  organizerId: string;
  slug: string;
  query?: string;
  status?: string;
  page: number;
  pageSize: number;
}) {
  const {
    rows: events,
    total,
    totalPages,
  } = await listOrganizerEvents({ organizerId, query, status, page, pageSize });

  if (events.length === 0) {
    return (
      <TableEmptyRow
        icon={CalendarDays}
        columns={EVENTS_COLUMN_COUNT}
        title="No events found"
        description={
          total === 0 && !query && (!status || status === "all")
            ? "Create your first event to start selling tickets."
            : "Try adjusting your search or status filter."
        }
      />
    );
  }

  return (
    <>
      <tbody>
        {events.map((event) => {
          const tiers = event.ticket_types ?? [];
          const capacity = tiers.reduce((sum, t) => sum + t.quantity_total, 0);
          const sold = tiers.reduce((sum, t) => sum + t.quantity_sold, 0);
          const gross = tiers.reduce((sum, t) => sum + t.quantity_sold * t.price_cents, 0);
          const currency = tiers[0]?.currency ?? "USD";

          return (
            <RowLink key={event.id} href={`/dashboard/${slug}/events/${event.id}`}>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-sunken">
                    {event.cover_image_url ? (
                      <Image
                        src={event.cover_image_url}
                        alt=""
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-xs font-semibold text-ink-3">
                        {event.title.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="truncate text-base font-medium text-ink block">
                      {event.title}
                    </span>
                  </div>
                </div>
              </td>

              <td className="whitespace-nowrap px-5 py-3.5 text-ink-3">
                {formatDate(event.starts_at, "medium")}
              </td>

              <td className="px-5 py-3.5">
                <EventStatusBadge status={event.status} size="xs" />
              </td>

              <td className="whitespace-nowrap px-5 py-3.5 text-xs text-ink-2">
                {event.seating_type === "reserved_seating" ? (
                  <span className="font-medium text-ink">Reserved</span>
                ) : (
                  <span className="text-ink-3">General</span>
                )}
              </td>

              <td className="px-5 py-3.5">
                <div className="w-36">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="tabular text-ink font-medium">
                      {formatNumber(sold)} / {formatNumber(capacity)}
                    </span>
                    <span className="text-2xs text-ink-3">
                      {capacity > 0 ? `${Math.round((sold / capacity) * 100)}%` : "0%"}
                    </span>
                  </div>
                  <Meter value={sold} max={capacity || 1} className="mt-1" />
                </div>
              </td>

              <td className="whitespace-nowrap px-5 py-3.5 text-right tabular font-medium text-ink">
                {formatMoney(gross, currency)}
              </td>

              <td className="px-5 py-3.5 text-right whitespace-nowrap">
                <Tooltip content="View public page">
                  <Button asChild variant="ghost" size="icon-sm" className="rounded-lg">
                    <Link href={`/events/${event.slug}`} target="_blank">
                      <ExternalLink className="size-3.5 text-ink-3" />
                    </Link>
                  </Button>
                </Tooltip>
              </td>
            </RowLink>
          );
        })}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={EVENTS_COLUMN_COUNT} className="p-0">
            <PaginationRow page={page} totalPages={totalPages} total={total} pageSize={pageSize} />
          </td>
        </tr>
      </tfoot>
    </>
  );
}
