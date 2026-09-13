import "server-only";
import { createClient } from "@/lib/supabase/server";
import { NEARBY_RADIUS_KM } from "@/features/map/geo";
import type { EventPin } from "@/lib/types";

/**
 * One place that calls `events_map`, so the browse page, the nearby block and
 * the API route cannot drift apart on filters or limits.
 */
export async function fetchEventPins({
  organizerSlug,
  categorySlug,
  city,
  location,
  radiusKm,
  from,
  to,
  limit,
}: {
  organizerSlug?: string;
  categorySlug?: string;
  city?: string;
  location?: { latitude: number; longitude: number } | null;
  radiusKm?: number | null;
  from?: Date;
  to?: Date;
  limit?: number;
} = {}): Promise<EventPin[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("events_map", {
    p_organizer_slug: organizerSlug,
    p_category_slug: categorySlug,
    p_city: city,
    p_lat: location?.latitude,
    p_lng: location?.longitude,
    // An explicit null radius means "everywhere", which is how the full map
    // still sorts by distance without hiding far-away events.
    p_radius_km: radiusKm ?? undefined,
    p_from: from?.toISOString(),
    p_to: to?.toISOString(),
    p_limit: limit,
  });

  if (error) {
    console.error("events_map failed", error.message);
    return [];
  }

  return (data ?? []) as EventPin[];
}

/** The "near me" query: same source, fixed radius, closest first. */
export function fetchNearbyPins(
  location: { latitude: number; longitude: number },
  organizerSlug?: string,
) {
  return fetchEventPins({
    organizerSlug,
    location,
    radiusKm: NEARBY_RADIUS_KM,
    limit: 50,
  });
}
