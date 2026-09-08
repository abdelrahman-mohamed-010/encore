import Link from "next/link";
import Image from "next/image";
import { CalendarDays, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Meter } from "@/components/ui/misc";
import { Tooltip } from "@/components/ui/tooltip";
import { PaginationRow, RowLink, TableEmptyRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();

  let dbQuery = supabase
    .from("events")
    .select(
      `id, title, slug, status, starts_at, cover_image_url, seating_type,
       ticket_types(price_cents, currency, quantity_total, quantity_sold, quantity_reserved)`,
      { count: "exact" },
    )
    .eq("organizer_id", organizerId);

  if (query?.trim()) dbQuery = dbQuery.ilike("title", `%${query.trim()}%`);
  if (status && status !== "all") dbQuery = dbQuery.eq("status", status as EventStatus);

  const from = (page - 1) * pageSize;
  const { data, count } = await dbQuery
    .order("starts_at", { ascending: false })
    .range(from, from + pageSize - 1);

  const events = (data ?? []) as unknown as DashboardEventItem[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

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
                <Badge tone={STATUS_TONE[event.status]} size="xs">
                  {event.status.replace("_", " ")}
                </Badge>
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
                    <Link href={`/events/${event.slug}`} target="_blank" onClick={(e) => e.stopPropagation()}>
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
