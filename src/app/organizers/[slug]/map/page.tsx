import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getOrganizerBySlug } from "@/features/organizers/queries";
import { fetchEventPins } from "@/lib/events-map";
import { getEdgeLocation } from "@/lib/geo-server";
import { MapExplorer } from "@/components/map/map-explorer";
import { Button } from "@/components/ui/button";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const data = await getOrganizerBySlug(slug);

  return {
    title: data ? `${data.name} on the map` : "Map",
    description: data ? `Every upcoming ${data.name} event, placed on a map.` : undefined,
  };
}

export default async function OrganizerMapPage({ params }: Params) {
  const { slug } = await params;
  const organizer = await getOrganizerBySlug(slug);

  if (!organizer) notFound();

  const location = await getEdgeLocation();
  const pins = await fetchEventPins({
    organizerSlug: slug,
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
            <Link href={`/organizers/${slug}`}>
              <ArrowLeft className="size-4" />
              <span>Back to {organizer.name}</span>
            </Link>
          </Button>
          <span className="h-4 w-px bg-hairline" />
          <h1 className="text-sm font-semibold text-ink truncate">
            {organizer.name} on the map
          </h1>
          <span className="rounded-full bg-sunken px-2 py-0.5 text-2xs font-semibold text-ink-3">
            {pins.length} {pins.length === 1 ? "event" : "events"}
          </span>
        </div>
      </header>

      <MapExplorer
        pins={pins}
        viewer={location}
        emptyMessage={`${organizer.name} has no upcoming events with a venue location.`}
        className="min-h-0 flex-1"
      />
    </div>
  );
}
