import Link from "next/link";
import { SearchX } from "lucide-react";
import { EventCard } from "@/components/events/event-card";
import { EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";
import type { EventSearchResult } from "@/lib/types";

const PAGE_SIZE = 24;

export async function EventsResults({
  resultsPromise,
  params,
  page,
}: {
  resultsPromise: PromiseLike<{ data: EventSearchResult[] | null }>;
  params: Record<string, string | string[] | undefined>;
  page: number;
}) {
  const { data: rows } = await resultsPromise;
  const events = (rows ?? []) as EventSearchResult[];
  const total = Number(events[0]?.total_count ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <p className="mb-2 text-md text-ink-2 tnum">
        {total > 0
          ? `${formatNumber(total)} ${total === 1 ? "event" : "events"} on sale.`
          : "Nothing matches those filters yet."}
      </p>

      {events.length === 0 ? (
        <EmptyState
          className="mt-10"
          icon={SearchX}
          title="No events match those filters"
          description="Try widening the date range, clearing the category, or searching for something else."
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/events">Clear filters</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event, index) => (
            <EventCard key={event.id} event={event} priority={index < 3} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
          <Button asChild variant="outline" size="sm" disabled={page <= 1}>
            <Link
              href={`/events?${new URLSearchParams({ ...(params as Record<string, string>), page: String(page - 1) })}`}
              aria-disabled={page <= 1}
            >
              Previous
            </Link>
          </Button>
          <span className="px-3 text-sm text-ink-3 tabular">
            Page {page} of {totalPages}
          </span>
          <Button asChild variant="outline" size="sm" disabled={page >= totalPages}>
            <Link
              href={`/events?${new URLSearchParams({ ...(params as Record<string, string>), page: String(page + 1) })}`}
              aria-disabled={page >= totalPages}
            >
              Next
            </Link>
          </Button>
        </nav>
      )}
    </>
  );
}
