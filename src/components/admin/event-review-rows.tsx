import Image from "next/image";
import Link from "next/link";
import { Search, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PaginationRow, TableEmptyRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { EventReviewActions } from "@/components/admin/event-review-actions";
import type { EventStatus } from "@/lib/types";

const TONE: Record<EventStatus, "positive" | "caution" | "neutral" | "critical"> = {
  published: "positive",
  draft: "neutral",
  pending_review: "caution",
  paused: "caution",
  cancelled: "critical",
  completed: "neutral",
};

export const EVENT_REVIEW_COLUMN_COUNT = 5;

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
  const supabase = await createClient();

  let dbQuery = supabase
    .from("events")
    .select(
      `id, title, slug, status, starts_at, cover_image_url, subtitle, created_at,
       organizer:organizers(id, name, slug),
       venue:venues(name, city),
       ticket_types(price_cents, quantity_total)`,
      { count: "exact" },
    )
    .in("status", ["pending_review", "published", "draft", "paused"]);

  if (status && status !== "all") dbQuery = dbQuery.eq("status", status as EventStatus);
  if (query?.trim()) dbQuery = dbQuery.ilike("title", `%${query.trim()}%`);

  const from = (page - 1) * pageSize;
  const { data, count } = await dbQuery
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  const events = (data ?? []).map((event) => ({
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
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

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
            <td className="px-5 py-3.5">
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
            <td className="whitespace-nowrap px-5 py-3.5 text-ink-3">
              {formatDate(event.startsAt, "medium")}
            </td>
            <td className="whitespace-nowrap px-5 py-3.5 text-ink-3">{event.organizerName || "—"}</td>
            <td className="px-5 py-3.5">
              <Badge tone={TONE[event.status]} size="xs">
                {event.status.replace("_", " ")}
              </Badge>
            </td>
            <td className="px-5 py-3.5 text-right">
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
      <tfoot>
        <tr>
          <td colSpan={EVENT_REVIEW_COLUMN_COUNT} className="p-0">
            <PaginationRow page={page} totalPages={totalPages} total={total} pageSize={pageSize} />
          </td>
        </tr>
      </tfoot>
    </>
  );
}
