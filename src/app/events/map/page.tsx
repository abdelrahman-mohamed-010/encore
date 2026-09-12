import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { fetchEventPins } from "@/lib/events-map";
import { getEdgeLocation } from "@/lib/geo-server";
import { MapExplorer } from "@/features/map/components/map-explorer";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Events Map · Explore all events on the map",
  description: "Browse upcoming events across venues and cities on the map.",
};

export default async function EventsMapPage() {
  const location = await getEdgeLocation();
  const pins = await fetchEventPins({
    location,
    radiusKm: null,
    limit: 300,
  });

  return (
    <div className="flex h-dvh w-screen flex-col bg-paper overflow-hidden">
      {/* Full-screen top navigation bar */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-hairline bg-card/90 px-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="rounded-xl gap-1.5 font-medium">
            <Link href="/events">
              <ArrowLeft className="size-4" />
              <span>Back to Events</span>
            </Link>
          </Button>
          <span className="h-4 w-px bg-hairline" />
          <h1 className="text-sm font-semibold text-ink">All Events Map</h1>
          <span className="rounded-full bg-sunken px-2 py-0.5 text-2xs font-semibold text-ink-3">
            {pins.length} {pins.length === 1 ? "event" : "events"}
          </span>
        </div>
      </header>

      <MapExplorer
        pins={pins}
        viewer={location}
        emptyMessage="No upcoming events with a venue location."
        className="min-h-0 flex-1"
      />
    </div>
  );
}
