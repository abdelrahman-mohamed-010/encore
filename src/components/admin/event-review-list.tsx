"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, ExternalLink, Search, Ticket, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/surface";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select";
import { TablePagination, TableRowsSkeleton, useTablePagination } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import type { EventStatus } from "@/lib/types";

export type ReviewEvent = {
  id: string;
  title: string;
  slug: string;
  status: EventStatus;
  subtitle: string | null;
  startsAt: string;
  coverImageUrl: string | null;
  organizerName: string;
  venueLabel: string;
  tiers: number;
  capacity: number;
};

const TONE: Record<EventStatus, "positive" | "caution" | "neutral" | "critical"> = {
  published: "positive",
  draft: "neutral",
  pending_review: "caution",
  paused: "caution",
  cancelled: "critical",
  completed: "neutral",
};

const COLUMN_COUNT = 5;

/** Static shell: search + status filter. Never a skeleton. */
export function EventReviewShell({ eventsPromise }: { eventsPromise: PromiseLike<ReviewEvent[]> }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form className="relative max-w-sm flex-1 min-w-48" onSubmit={(e) => e.preventDefault()}>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by event or organizer"
            className="pl-9"
            aria-label="Search events"
          />
        </form>

        <SelectField
          value={filter}
          onChange={setFilter}
          aria-label="Filter events by status"
          size="sm"
          className="w-40"
          options={[
            { value: "all", label: "All Statuses" },
            { value: "pending_review", label: "Pending Review" },
            { value: "published", label: "Published" },
            { value: "draft", label: "Draft" },
            { value: "paused", label: "Paused" },
          ]}
        />
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead>
            <tr className="border-b border-hairline text-2xs uppercase tracking-[0.06em] text-ink-3">
              <th scope="col" className="px-4 py-3 font-semibold">Event</th>
              <th scope="col" className="px-4 py-3 font-semibold">Date</th>
              <th scope="col" className="px-4 py-3 font-semibold">Organizer</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3 text-right" />
            </tr>
          </thead>
          <React.Suspense fallback={<TableRowsSkeleton rows={6} columns={COLUMN_COUNT} />}>
            <EventReviewRows eventsPromise={eventsPromise} query={query} filter={filter} />
          </React.Suspense>
        </table>
      </Card>
    </div>
  );
}

function EventReviewRows({
  eventsPromise,
  query,
  filter,
}: {
  eventsPromise: PromiseLike<ReviewEvent[]>;
  query: string;
  filter: string;
}) {
  const router = useRouter();
  const events = React.use(eventsPromise);
  const [pending, startTransition] = useTransition();

  const filteredEvents = React.useMemo(() => {
    return events.filter((e) => {
      const matchesFilter = filter === "all" || e.status === filter;
      const matchesQuery =
        !query.trim() ||
        e.title.toLowerCase().includes(query.toLowerCase().trim()) ||
        e.organizerName.toLowerCase().includes(query.toLowerCase().trim());
      return matchesFilter && matchesQuery;
    });
  }, [events, filter, query]);

  const {
    paginatedItems,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    setPage,
    setPageSize,
  } = useTablePagination(filteredEvents, 10);

  function setStatus(event: ReviewEvent, status: EventStatus, reason?: string) {
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("events")
        .update({ status, rejection_reason: reason ?? null })
        .eq("id", event.id);

      if (error) {
        toast.error("Could not update the event", { description: error.message });
        return;
      }

      toast.success(
        status === "published"
          ? `${event.title} is live`
          : status === "draft"
            ? `${event.title} returned to draft`
            : `${event.title} moved to ${status.replace("_", " ")}`,
      );
      router.refresh();
    });
  }

  if (filteredEvents.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={COLUMN_COUNT} className="px-4 py-16 text-center">
            <p className="text-sm font-medium text-ink">No events found</p>
            <p className="mt-1 text-sm text-ink-3">Try a different search term or filter.</p>
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <>
      <tbody>
        {paginatedItems.map((event) => (
          <tr key={event.id} className="border-b border-hairline-soft last:border-b-0 hover:bg-sunken">
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-sunken flex items-center justify-center">
                  {event.coverImageUrl ? (
                    <Image
                      src={event.coverImageUrl}
                      alt=""
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
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
                  <p className="truncate text-xs text-ink-3">
                    {event.venueLabel || "No venue"}
                  </p>
                </div>
              </div>
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-ink-3">
              {formatDate(event.startsAt, "medium")}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-ink-3">
              {event.organizerName || "—"}
            </td>
            <td className="px-4 py-3">
              <Badge tone={TONE[event.status]} size="xs">
                {event.status.replace("_", " ")}
              </Badge>
            </td>
            <td className="px-4 py-3 text-right">
              <div className="flex items-center justify-end gap-1.5">
                {event.status === "pending_review" && (
                  <>
                    <Button
                      variant="ghost"
                      size="xs"
                      disabled={pending}
                      onClick={() => setStatus(event, "draft", "Returned by an administrator")}
                    >
                      <X className="size-3.5" /> Reject
                    </Button>
                    <Button
                      variant="solid"
                      size="xs"
                      disabled={pending || event.tiers === 0}
                      title={event.tiers === 0 ? "This event has no ticket types yet" : undefined}
                      onClick={() => setStatus(event, "published")}
                    >
                      <Check className="size-3.5" /> Approve
                    </Button>
                  </>
                )}

                {event.status === "published" && (
                  <Button
                    variant="ghost"
                    size="xs"
                    disabled={pending}
                    onClick={() => setStatus(event, "paused")}
                  >
                    Pause
                  </Button>
                )}

                {event.status === "paused" && (
                  <Button
                    variant="solid"
                    size="xs"
                    disabled={pending}
                    onClick={() => setStatus(event, "published")}
                  >
                    Resume
                  </Button>
                )}

                <Button asChild variant="ghost" size="xs">
                  <Link href={`/events/${event.slug}`} target="_blank">
                    <ExternalLink className="size-3.5" />
                  </Link>
                </Button>
              </div>
            </td>
          </tr>
        ))}
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
