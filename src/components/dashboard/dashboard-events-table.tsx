"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ExternalLink, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/surface";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select";
import { Meter } from "@/components/ui/misc";
import { TablePagination, TableRowsSkeleton, useTablePagination } from "@/components/ui/table";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import type { EventStatus } from "@/lib/types";

const STATUS_TONE: Record<EventStatus, "positive" | "caution" | "neutral" | "critical"> = {
  published: "positive",
  draft: "neutral",
  pending_review: "caution",
  paused: "caution",
  cancelled: "critical",
  completed: "neutral",
};

export type DashboardEventItem = {
  id: string;
  title: string;
  slug: string;
  status: EventStatus;
  starts_at: string;
  cover_image_url: string | null;
  seating_type: string | null;
  ticket_types?: {
    price_cents: number;
    currency: string;
    quantity_total: number;
    quantity_sold: number;
    quantity_reserved: number;
  }[];
};

const COLUMN_COUNT = 7;

/** Static shell: search, status filter, and the "New event" action. Never a skeleton — it's real from first paint. */
export function DashboardEventsShell({
  eventsPromise,
  slug,
}: {
  eventsPromise: PromiseLike<DashboardEventItem[]>;
  slug: string;
}) {
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-56 max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events by title..."
              className="pl-9"
              aria-label="Search events"
            />
          </div>

          <SelectField
            value={statusFilter}
            onChange={setStatusFilter}
            aria-label="Filter events by status"
            className="w-40"
            options={[
              { value: "all", label: "All statuses" },
              { value: "published", label: "Published" },
              { value: "draft", label: "Draft" },
              { value: "pending_review", label: "Pending review" },
              { value: "paused", label: "Paused" },
              { value: "completed", label: "Completed" },
              { value: "cancelled", label: "Cancelled" },
            ]}
          />
        </div>

        <Button asChild variant="solid" size="md">
          <Link href={`/dashboard/${slug}/events/new`}>
            <Plus /> New event
          </Link>
        </Button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[50rem] text-left text-sm">
          <thead>
            <tr className="border-b border-hairline text-2xs uppercase tracking-[0.06em] text-ink-3">
              <th scope="col" className="px-4 py-3 font-semibold">Event</th>
              <th scope="col" className="px-4 py-3 font-semibold">Date</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3 font-semibold">Seating</th>
              <th scope="col" className="px-4 py-3 font-semibold">Tickets Sold</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Gross</th>
              <th scope="col" className="px-4 py-3 text-right" />
            </tr>
          </thead>
          <React.Suspense fallback={<TableRowsSkeleton rows={6} columns={COLUMN_COUNT} />}>
            <EventsRows
              eventsPromise={eventsPromise}
              query={query}
              statusFilter={statusFilter}
              slug={slug}
            />
          </React.Suspense>
        </table>
      </Card>
    </div>
  );
}

function EventsRows({
  eventsPromise,
  query,
  statusFilter,
  slug,
}: {
  eventsPromise: PromiseLike<DashboardEventItem[]>;
  query: string;
  statusFilter: string;
  slug: string;
}) {
  const router = useRouter();
  const events = React.use(eventsPromise);

  const filteredEvents = React.useMemo(() => {
    return events.filter((e) => {
      const matchesQuery =
        !query.trim() || e.title.toLowerCase().includes(query.toLowerCase().trim());
      const matchesStatus = statusFilter === "all" || e.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [events, query, statusFilter]);

  const {
    paginatedItems,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    setPage,
    setPageSize,
  } = useTablePagination(filteredEvents, 10);

  if (filteredEvents.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={COLUMN_COUNT} className="px-4 py-16 text-center">
            <p className="text-sm font-medium text-ink">No events found</p>
            <p className="mt-1 text-sm text-ink-3">
              {events.length === 0
                ? "Create your first event to start selling tickets."
                : "Try adjusting your search or status filter."}
            </p>
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <>
      <tbody>
        {paginatedItems.map((event) => {
          const tiers = event.ticket_types ?? [];
          const capacity = tiers.reduce((sum, t) => sum + t.quantity_total, 0);
          const sold = tiers.reduce((sum, t) => sum + t.quantity_sold, 0);
          const gross = tiers.reduce((sum, t) => sum + t.quantity_sold * t.price_cents, 0);
          const currency = tiers[0]?.currency ?? "USD";

          return (
            <tr
              key={event.id}
              onClick={() => router.push(`/dashboard/${slug}/events/${event.id}`)}
              className="border-b border-hairline-soft last:border-b-0 hover:bg-sunken/70 transition-colors cursor-pointer"
            >
              <td className="px-4 py-3">
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

              <td className="whitespace-nowrap px-4 py-3 text-ink-3">
                {formatDate(event.starts_at, "medium")}
              </td>

              <td className="px-4 py-3">
                <Badge tone={STATUS_TONE[event.status]} size="xs">
                  {event.status.replace("_", " ")}
                </Badge>
              </td>

              <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-2">
                {event.seating_type === "reserved_seating" ? (
                  <span className="font-medium text-ink">Reserved</span>
                ) : (
                  <span className="text-ink-3">General</span>
                )}
              </td>

              <td className="px-4 py-3">
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

              <td className="whitespace-nowrap px-4 py-3 text-right tabular font-medium text-ink">
                {formatMoney(gross, currency)}
              </td>

              <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                <Button asChild variant="ghost" size="icon-sm" className="rounded-lg" title="View public page">
                  <Link href={`/events/${event.slug}`} target="_blank">
                    <ExternalLink className="size-3.5 text-ink-3" />
                  </Link>
                </Button>
              </td>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={COLUMN_COUNT} className="p-0">
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </td>
        </tr>
      </tfoot>
    </>
  );
}
