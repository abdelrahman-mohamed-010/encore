import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { fetchNearbyPins } from "@/lib/events-map";
import { NEARBY_RADIUS_KM } from "@/lib/geo";
import { getEdgeLocation } from "@/lib/geo-server";

/**
 * The "near me" list.
 *
 * This lives in a route handler rather than in the organizer page itself for a
 * caching reason: the page is ISR-cached for everyone, and reading request
 * headers there would force the whole route dynamic. Personalised content
 * belongs behind its own request, so the page stays cached and fast.
 *
 * Location comes from whichever source the caller has:
 *   - explicit lat/lng, meaning the visitor granted the browser prompt;
 *   - otherwise Vercel's edge headers, which need no prompt at all.
 *
 * Only published events are read, through the caller's own RLS, so there is
 * nothing here a visitor could not already see. Coordinates are used to answer
 * this one request and never stored.
 */

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  organizer: z.string().trim().min(1).max(80).optional(),
});

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid coordinates." }, { status: 400 });
  }

  const { lat, lng, organizer } = parsed.data;
  const precise = lat !== undefined && lng !== undefined;

  const edge = precise ? null : await getEdgeLocation();
  const viewer = precise ? { latitude: lat, longitude: lng } : edge;

  const empty = { pins: [], viewer: null, label: null, radiusKm: NEARBY_RADIUS_KM };
  const headers = {
    // Per-visitor coordinates: a shared cache must never hold this.
    "Cache-Control": "private, no-store",
  };

  if (!viewer) return NextResponse.json(empty, { headers });

  const pins = await fetchNearbyPins(viewer, organizer);

  return NextResponse.json(
    { pins, viewer, label: edge?.label ?? null, radiusKm: NEARBY_RADIUS_KM },
    { headers },
  );
}
