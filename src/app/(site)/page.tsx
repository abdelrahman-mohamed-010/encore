import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { getHomeData } from "@/features/catalog/queries";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/surface";
import { EventCard, EventCardSkeleton, EventRow } from "@/features/catalog/components/event-card";
import { CategoryRail } from "@/features/catalog/components/category-rail";
import { HeroCollage } from "@/features/home/components/hero-collage";
import { ClosingCta } from "@/features/home/components/closing-cta";
import { SiteFooter } from "@/components/layout/site-footer";
import { SearchField } from "@/components/layout/search-field";
import { formatNumber } from "@/lib/format";

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

export default async function HomePage() {
  const { upcoming, categories, totalEvents } = await getHomeData();
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
          <CategoryRail categories={categories} className="sm:justify-center" />
        </div>
      </section>

      {/* ---- Upcoming + rail ----------------------------------------------- */}
      <section className="container-page pb-14 md:pb-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0">
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
                {upcoming.slice(0, 6).map((event, index) => (
                  <EventCard key={event.id} event={event} priority={index === 0} />
                ))}
              </div>
            </Suspense>
          </div>

          <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
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
