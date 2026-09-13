import { MapPin } from "lucide-react";
import Link from "next/link";
import { EventCardSkeleton } from "@/features/catalog/components/event-card";
import { Button } from "@/components/ui/button";
import { Shimmer } from "@/components/ui/skeleton";

/**
 * Exists purely so `/events` gets prefetched from the "Discover" nav link —
 * a dynamic route with no loading.tsx isn't prefetched at all. The real page
 * streams its own accurate fallbacks once here; this only needs to cover the
 * instant it takes for that streaming response to start arriving.
 */
export default function Loading() {
  return (
    <div className="container-page py-10 md:py-12">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="display-2 text-ink">Discover events</h1>
        <Button asChild variant="outline" size="sm" className="rounded-xl gap-1.5">
          <Link href="/events/map">
            <MapPin className="size-3.5" />
            <span>Map view</span>
          </Link>
        </Button>
      </header>

      <Shimmer className="h-9 w-full max-w-md rounded-full" />
      <Shimmer className="mt-6 h-9 rounded-lg" />

      <div className="mt-8">
        <Shimmer className="mb-2 h-5 w-40" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} />)}
        </div>
      </div>
    </div>
  );
}
