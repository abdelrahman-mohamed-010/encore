"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/features/catalog/components/event-card";
import type { EventSearchResult } from "@/lib/types";

export function LoadMoreEvents({
  initialEvents,
  total,
  pageSize,
  searchParamsString,
}: {
  initialEvents: EventSearchResult[];
  total: number;
  pageSize: number;
  /** The current filter query string (no `offset`), reused for every next page. */
  searchParamsString: string;
}) {
  const [events, setEvents] = useState(initialEvents);
  const [loading, setLoading] = useState(false);

  const hasMore = events.length < total;

  async function loadMore() {
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParamsString);
      params.set("offset", String(events.length));
      const res = await fetch(`/api/events/search?${params.toString()}`);
      if (!res.ok) return;
      const { events: next } = (await res.json()) as { events: EventSearchResult[] };
      setEvents((prev) => [...prev, ...next]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event, index) => (
          <EventCard key={event.id} event={event} priority={index < 3} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-10 flex justify-center">
          <Button variant="outline" size="lg" onClick={loadMore} loading={loading}>
            Show more ({total - events.length} left)
          </Button>
        </div>
      )}
    </>
  );
}
