import Link from "next/link";
import { SearchX } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { LoadMoreEvents } from "@/features/catalog/components/load-more-events";
import { formatNumber } from "@/lib/format";
import type { EventSearchResult } from "@/lib/types";
import type { EventSearchParams } from "@/features/catalog/search-params";

export async function EventsResults({
  resultsPromise,
  params,
  pageSize,
}: {
  resultsPromise: PromiseLike<{ data: EventSearchResult[] | null }>;
  params: EventSearchParams;
  pageSize: number;
}) {
  const { data: rows } = await resultsPromise;
  const events = (rows ?? []) as EventSearchResult[];
  const total = Number(events[0]?.total_count ?? 0);

  // The same filters the initial fetch used, minus paging — "load more"
  // appends an `offset` of its own on top of this.
  const filterParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (!value || key === "offset") continue;
    filterParams.set(key, Array.isArray(value) ? value[0] : value);
  }

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
        <LoadMoreEvents
          initialEvents={events}
          total={total}
          pageSize={pageSize}
          searchParamsString={filterParams.toString()}
        />
      )}
    </>
  );
}
