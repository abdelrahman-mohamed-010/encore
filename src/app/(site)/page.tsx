import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, BarChart3, QrCode, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/surface";
import { EventCard, EventCardSkeleton, EventRow } from "@/components/events/event-card";
import { CategoryRail } from "@/components/events/category-rail";
import { SearchField } from "@/components/layout/search-field";
import { formatNumber } from "@/lib/format";
import type { EventSearchResult } from "@/lib/types";

export const revalidate = 60;

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
      <section>
        <div className="container-page py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Link
              href="/events?featured=1"
              className="inline-flex items-center gap-2 rounded-full bg-sunken px-3.5 py-2 text-sm font-medium text-ink-2 transition-colors hover:bg-sunken-2 hover:text-ink"
            >
              <Sparkles className="size-4" />
              {formatNumber(Number(totalEvents))} events on sale right now
              <ArrowRight className="size-3.5" />
            </Link>

            {/*
              The serif carries the line the page is actually about; the rest of
              the sentence stays in the UI sans so the flourish reads as emphasis
              rather than as a different typeface bolted on.
            */}
            <h1 className="display-1 mt-7 text-ink">
              Find your next{" "}
              <span className="font-flourish italic">night out</span>.
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-2">
              Concerts, theatre, conferences and festivals — booked in seconds, with your tickets
              waiting in your pocket.
            </p>

            <div className="mx-auto mt-9 max-w-xl">
              <Suspense fallback={<div className="h-(--size-field-lg) rounded-md bg-sunken" />}>
                <SearchField size="lg" autoFocus={false} />
              </Suspense>
            </div>
          </div>

          <div className="mt-12">
            <CategoryRail categories={categories} className="justify-center" />
          </div>
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

          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((event, index) => (
              <EventCard key={event.id} event={event} priority={index === 0} />
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
                  <Link href="/events">Browse all <ArrowRight /></Link>
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

      {/* ---- Organizer pitch ------------------------------------------------ */}
      <section className="border-t border-hairline">
        <div className="container-page py-16 md:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="eyebrow">For organizers</p>
              <h2 className="display-2 mt-3 text-ink">
                Sell tickets on your{" "}
                <span className="font-flourish italic">own</span> Stripe account.
              </h2>
              <p className="mt-4 max-w-lg text-md leading-relaxed text-ink-2">
                Connect Stripe once and money from every sale lands directly in your account —
                Tazkarti only takes its service fee. Build your event, set your tiers, and watch
                sales land in real time.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild variant="solid" size="lg">
                  <Link href="/dashboard/new">Start selling <ArrowRight /></Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/pricing">See pricing</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: Wallet, title: "Your Stripe, your money", body: "Direct payouts to the account you connect. No waiting on us to settle." },
                { icon: BarChart3, title: "Live sales", body: "Revenue, tickets and check-ins updating as they happen." },
                { icon: QrCode, title: "Check-in that works", body: "Scan QR codes at the door from any phone, online or off." },
                { icon: ShieldCheck, title: "Never oversold", body: "Inventory is held under a database lock, so two buyers can't take one seat." },
              ].map((feature) => (
                <div key={feature.title} className="rounded-2xl bg-card p-5 shadow-e1">
                  <span className="grid size-10 place-items-center rounded-xl bg-sunken text-ink-2">
                    <feature.icon className="size-[18px]" />
                  </span>
                  <p className="mt-4 text-md font-semibold text-ink">{feature.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-3">{feature.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
