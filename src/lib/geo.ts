/**
 * Location helpers safe on both sides of the network boundary.
 *
 * Anything that reads request headers lives in `geo-server.ts` instead — a
 * client component importing `next/headers` (even transitively, for one pure
 * formatter) fails the build, so the split is load-bearing rather than tidy.
 */

export type ViewerLocation = {
  latitude: number;
  longitude: number;
  /** Best available label, e.g. "Cairo" or "Egypt". Null when unknown. */
  label: string | null;
  source: "edge" | "browser";
};

/** How far out "near me" reaches, in kilometres. */
export const NEARBY_RADIUS_KM = 60;

/** Great-circle distance in km. Mirrors what `events_map` computes in SQL. */
export function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(km: number | null | undefined) {
  if (km === null || km === undefined || !Number.isFinite(km)) return null;
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  if (km < 10) return `${km.toFixed(1)} km away`;
  return `${Math.round(km)} km away`;
}
