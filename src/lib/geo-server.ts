import "server-only";
import { headers } from "next/headers";
import type { ViewerLocation } from "@/lib/geo";

/**
 * Where the viewer is, inferred without asking them.
 *
 * Vercel's edge attaches approximate coordinates to every request: free, no
 * permission prompt, no third-party service, accurate to roughly the city.
 * That is enough to answer "what's on near me" the moment a page loads.
 *
 * The exact alternative — the browser Geolocation API — costs a permission
 * prompt, so it stays opt-in and client-side. Everything downstream must work
 * with no location at all: plenty of visitors are on a VPN or will decline.
 */

function parseCoordinate(value: string | null, limit: number) {
  if (!value) return null;
  const parsed = Number(value);
  // Reject NaN and out-of-range values rather than passing junk into a radius
  // query that would then silently return nothing.
  return Number.isFinite(parsed) && Math.abs(parsed) <= limit ? parsed : null;
}

/** Returns null off-Vercel (local dev) or when the headers are absent. */
export async function getEdgeLocation(): Promise<ViewerLocation | null> {
  const head = await headers();

  const latitude = parseCoordinate(head.get("x-vercel-ip-latitude"), 90);
  const longitude = parseCoordinate(head.get("x-vercel-ip-longitude"), 180);
  if (latitude === null || longitude === null) return null;

  // The city header is URI-encoded, since city names carry non-ASCII.
  const rawCity = head.get("x-vercel-ip-city");
  let city: string | null = null;
  if (rawCity) {
    try {
      city = decodeURIComponent(rawCity);
    } catch {
      city = rawCity;
    }
  }

  return {
    latitude,
    longitude,
    label: city ?? head.get("x-vercel-ip-country"),
    source: "edge",
  };
}
