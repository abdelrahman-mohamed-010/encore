import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/surface";
import { EventCard, EventCardSkeleton, EventRow } from "@/components/events/event-card";
import { CategoryRail } from "@/components/events/category-rail";
import { HeroCollage } from "@/components/home/hero-collage";
import { ClosingCta } from "@/components/home/closing-cta";
import { SiteFooter } from "@/components/layout/site-footer";
import { SearchField } from "@/components/layout/search-field";
import { formatNumber } from "@/lib/format";
import type { EventSearchResult } from "@/lib/types";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Discover events near you",
  description:
    "Browse concerts, theatre, conferences and festivals, buy tickets in seconds, and manage your own events with real-time sales and check-in.",
  openGraph: {
    title: "Encore — Find your next night out",
    description: "Discover and book events. Sell tickets with real-time sales and check-in.",
    type: "website",
  },
};

async function getHomeData() {
  const supabase = await createClient();

  const [featured, upcoming, categories, counts] = await Promise.all([
    supabase.rpc("search_events", { p_featured_only: true, p_limit: 3 }),
    supabase.rpc("search_events", { p_sort: "soonest", p_limit: 9 }),
    supabase.from("categories").select("*").eq("is_active", true).order("sort_order"),
    supabase.rpc("search_events", { p_limit: 1 }),
  ]);

  return {
    featured: (featured.data ?? []) as EventSearchResult[],
    upcoming: (upcoming.data ?? []) as EventSearchResult[],
    categories: categories.data ?? [],
    totalEvents: counts.data?.[0]?.total_count ?? 0,
  };
}

export default async function HomePage() {
  const { featured, upcoming, categories, totalEvents } = await getHomeData();
  const soonest = upcoming.slice(0, 5);

  return (
    <>
      {/* ---- Hero ---------------------------------------------------------- */}
      <HeroCollage />

      {/* ---- Search + categories -------------------------------------------- */}
      <section className="container-page relative z-10 pt-4 pb-6">
        <div className="mx-auto max-w-xl">
          <Suspense fallback={<div className="h-(--size-field-lg) rounded-md bg-sunken" />}>
            <SearchField size="lg" autoFocus={false} />
          </Suspense>
        </div>
        <p className="mt-4 text-center text-md text-ink-2">
          {formatNumber(Number(totalEvents))} events on sale right now
        </p>
        <div className="mt-8">
          <CategoryRail categories={categories} className="justify-center" />
        </div>
      </section>

      {/* ---- Featured ------------------------------------------------------ */}
      {featured.length > 0 && (
        <section className="container-page py-14 md:py-16">
          <SectionHeader
            eyebrow="Handpicked"
            title="Featured this season"
            description="The events our team would clear a night for."
            action={
              <Button asChild variant="outline" size="sm">
                <Link href="/events?featured=1">
                  See all <ArrowRight />
                </Link>
              </Button>
            }
          />

          <div className="no-scrollbar -mx-4 mt-7 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            {featured.map((event, index) => (
              <div key={event.id} className="w-72 shrink-0 snap-start sm:w-80">
                <EventCard event={event} priority={index === 0} className="h-full" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---- Upcoming + rail ----------------------------------------------- */}
      <section className="container-page pb-14 md:pb-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div>
            <SectionHeader
              title="Happening soon"
              description="The next events to go on stage."
              action={
                <Button asChild variant="ghost" size="sm">
                  <Link href="/events">Discover all <ArrowRight /></Link>
                </Button>
              }
            />
            <Suspense
              fallback={
                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, i) => <EventCardSkeleton key={i} />)}
                </div>
              }
            >
              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                {upcoming.slice(0, 6).map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </Suspense>
          </div>

          <aside className="lg:sticky lg:top-20 lg:self-start">
            <p className="eyebrow mb-3">Next up</p>
            <div className="space-y-2">
              {soonest.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          </aside>
        </div>
      </section>

      {/* ---- Closing panel --------------------------------------------------- */}
      <ClosingCta />

      {/* ---- Site Footer (landing page only) -------------------------------- */}
      <SiteFooter />
    </>
  );
}
