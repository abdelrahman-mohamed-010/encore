import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchEventPins } from "@/lib/events-map";
import { getEdgeLocation } from "@/lib/geo-server";
import { MapExplorer } from "@/components/map/map-explorer";
import { Breadcrumbs } from "@/components/ui/nav";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("organizers")
    .select("name")
    .eq("slug", slug)
    .maybeSingle();

  return {
    title: data ? `${data.name} on the map` : "Map",
    description: data ? `Every upcoming ${data.name} event, placed on a map.` : undefined,
  };
}

export default async function OrganizerMapPage({ params }: Params) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: organizer } = await supabase
    .from("organizers")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (!organizer) notFound();

  // Sorting by distance is a nicety here, not a filter: with no radius the
  // full set is returned either way, just ordered usefully when we know where
  // the visitor is.
  const location = await getEdgeLocation();
  const pins = await fetchEventPins({
    organizerSlug: slug,
    location,
    radiusKm: null,
    limit: 300,
  });

  return (
    <div className="flex h-[calc(100dvh-var(--header-h,4rem))] flex-col">
      <div className="shrink-0 border-b border-hairline px-4 py-3 sm:px-6">
        <Breadcrumbs
          items={[
            { label: "Organizers", href: "/organizers" },
            { label: organizer.name, href: `/organizers/${slug}` },
            { label: "Map" },
          ]}
        />
        <h1 className="mt-1 text-xl font-semibold text-ink">
          {organizer.name} on the map
        </h1>
      </div>

      <MapExplorer
        pins={pins}
        viewer={location}
        emptyMessage={`${organizer.name} has no upcoming events with a venue location.`}
        className="min-h-0 flex-1"
      />
    </div>
  );
}
