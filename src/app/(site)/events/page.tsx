import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { getEventFilterOptions, searchEvents } from "@/features/catalog/queries";
import { EventCardSkeleton } from "@/components/events/event-card";
import { EventFilters } from "@/components/events/event-filters";
import { CategoryRail } from "@/components/events/category-rail";
import { Button } from "@/components/ui/button";
import { single, type EventSearchParams } from "@/lib/event-search-params";
import { EventsResults } from "./events-results";

export const metadata: Metadata = {
  title: "Discover events",
  description: "Search concerts, theatre, conferences and festivals on Encore.",
};

const PAGE_SIZE = 20;

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<EventSearchParams>;
}) {
  const params = await searchParams;
  const query = single(params, "q");
  const { categories, cities } = await getEventFilterOptions();
  const resultsPromise = searchEvents(params, PAGE_SIZE, 0);

  return (
    <div className="container-page py-10 md:py-12">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="display-2 text-ink">
          {query ? `Results for “${query}”` : "Discover events"}
        </h1>

        <Button asChild variant="outline" size="sm" className="rounded-xl gap-1.5">
          <Link href="/events/map">
            <MapPin className="size-3.5" />
            <span>Map view</span>
          </Link>
        </Button>
      </header>

      <CategoryRail
        categories={categories ?? []}
        activeSlug={single(params, "category")}
        className="mb-6"
      />

      <Suspense fallback={<div className="h-9 rounded-lg bg-sunken" />}>
        <EventFilters categories={categories ?? []} cities={cities} />
      </Suspense>

      <Suspense
        key={JSON.stringify(params)}
        fallback={
          <div className="mt-8">
            <div className="mb-2 h-5 w-40 rounded bg-sunken" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} />)}
            </div>
          </div>
        }
      >
        <div className="mt-8">
          <EventsResults resultsPromise={resultsPromise} params={params} pageSize={PAGE_SIZE} />
        </div>
      </Suspense>
    </div>
  );
}
