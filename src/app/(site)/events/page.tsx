import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EventCard, EventCardSkeleton } from "@/components/events/event-card";
import { EventFilters } from "@/components/events/event-filters";
import { CategoryRail } from "@/components/events/category-rail";
import { EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";
import type { EventSearchResult } from "@/lib/types";

export const metadata: Metadata = {
  title: "Browse events",
  description: "Search concerts, theatre, conferences and festivals on Tazkarti.",
};

const PAGE_SIZE = 24;

type SearchParams = Record<string, string | string[] | undefined>;

function single(params: SearchParams, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

/** Translate the "when" chip into an explicit window the RPC understands. */
function dateWindow(when?: string): { from?: string; to?: string } {
  if (!when) return {};
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (when === "today") {
    const end = new Date(startOfDay);
    end.setDate(end.getDate() + 1);
    return { from: now.toISOString(), to: end.toISOString() };
  }
  if (when === "weekend") {
    const day = startOfDay.getDay();
    const friday = new Date(startOfDay);
    friday.setDate(friday.getDate() + ((5 - day + 7) % 7));
    const monday = new Date(friday);
    monday.setDate(friday.getDate() + 3);
    return { from: friday.toISOString(), to: monday.toISOString() };
  }
  const days = when === "week" ? 7 : when === "month" ? 30 : 0;
  if (!days) return {};
  const end = new Date(startOfDay);
  end.setDate(end.getDate() + days);
  return { from: now.toISOString(), to: end.toISOString() };
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const page = Math.max(1, Number(single(params, "page") ?? 1) || 1);
  const window = dateWindow(single(params, "when"));

  const [{ data: rows }, { data: categories }, { data: venues }] = await Promise.all([
    supabase.rpc("search_events", {
      p_query: single(params, "q") ?? undefined,
      p_category_slug: single(params, "category") ?? undefined,
      p_city: single(params, "city") ?? undefined,
      p_from: window.from,
      p_to: window.to,
      p_free_only: single(params, "free") === "1",
      p_featured_only: single(params, "featured") === "1",
      p_organizer_slug: single(params, "organizer") ?? undefined,
      p_sort: single(params, "sort") ?? "soonest",
      p_limit: PAGE_SIZE,
      p_offset: (page - 1) * PAGE_SIZE,
    }),
    supabase.from("categories").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("venues").select("city").eq("is_active", true),
  ]);

  const events = (rows ?? []) as EventSearchResult[];
  const total = Number(events[0]?.total_count ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const cities = [...new Set((venues ?? []).map((v) => v.city).filter(Boolean))].sort();

  const query = single(params, "q");

  return (
    <div className="container-page py-10 md:py-12">
      <header className="mb-8">
        <h1 className="display-2 text-ink">
          {query ? `Results for “${query}”` : "Browse events"}
        </h1>
        <p className="mt-2 text-md text-ink-2">
          {total > 0
            ? `${formatNumber(total)} ${total === 1 ? "event" : "events"} on sale.`
            : "Nothing matches those filters yet."}
        </p>
      </header>

      <CategoryRail
        categories={categories ?? []}
        activeSlug={single(params, "category")}
        className="mb-6"
      />

      <Suspense fallback={<div className="h-9 rounded-lg bg-sunken" />}>
        <EventFilters categories={categories ?? []} cities={cities} total={total} />
      </Suspense>

      <Suspense
        key={JSON.stringify(params)}
        fallback={
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} />)}
          </div>
        }
      >
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
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event, index) => (
              <EventCard key={event.id} event={event} priority={index < 3} />
            ))}
          </div>
        )}
      </Suspense>

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
    </div>
  );
}
