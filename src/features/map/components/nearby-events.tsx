"use client";

import * as React from "react";
import Link from "next/link";
import { Compass, Map as MapIcon, MapPin } from "lucide-react";
import { EventMap } from "@/features/map/components/event-map";
import { Button } from "@/components/ui/button";
import { Card, SectionHeader } from "@/components/ui/surface";
import { Callout } from "@/components/ui/callout";
import { useAsyncAction } from "@/hooks";
import { formatDistance } from "@/lib/geo";
import type { EventPin } from "@/lib/types";

/**
 * "What's on near me" for one organizer.
 *
 * Three outcomes, all of which have to be good, because most visitors land in
 * one of the two that are not the happy path:
 *
 *   1. We know where you are and something is nearby  -> map + count.
 *   2. We know where you are and nothing is nearby    -> say so plainly, and
 *      offer the whole map instead. Not an error state.
 *   3. We do not know where you are                   -> offer to ask, and
 *      still offer the whole map. Never a dead end.
 *
 * On mount it asks the server what the edge headers already reveal, which
 * reaches case 1 with no permission prompt at all. The button is the upgrade
 * path to exact browser coordinates, taken only if the visitor asks for it.
 *
 * This fetches rather than receiving server props on purpose: the organizer
 * page is ISR-cached for everyone, and personalising it on the server would
 * make the whole route dynamic.
 */

type Located = {
  pins: EventPin[];
  viewer: { latitude: number; longitude: number } | null;
  label: string | null;
  radiusKm: number;
};

export function NearbyEvents({
  organizerSlug,
  organizerName,
}: {
  organizerSlug: string;
  organizerName: string;
}) {
  const [state, setState] = React.useState<Located | null>(null);
  const [settled, setSettled] = React.useState(false);
  const [denied, setDenied] = React.useState(false);

  // The no-prompt attempt: ask the server what it can infer from the edge
  // headers. Runs once, and a failure here is not worth surfacing — the
  // component simply falls through to "use my location".
  React.useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/events/nearby?organizer=${encodeURIComponent(organizerSlug)}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: Located | null) => {
        if (data?.viewer) setState(data);
      })
      .catch(() => {})
      .finally(() => setSettled(true));

    return () => controller.abort();
  }, [organizerSlug]);

  const locate = useAsyncAction(async () => {
    if (!("geolocation" in navigator)) {
      throw new Error("This browser cannot share your location.");
    }

    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 10_000,
        maximumAge: 5 * 60_000,
      });
    }).catch((error: GeolocationPositionError) => {
      // A refusal is a choice, not a failure: record it so we stop asking.
      if (error.code === error.PERMISSION_DENIED) setDenied(true);
      throw new Error(
        error.code === error.PERMISSION_DENIED
          ? "Location access was denied. You can still discover the full map."
          : "Could not determine your location.",
      );
    });

    const params = new URLSearchParams({
      organizer: organizerSlug,
      lat: String(position.coords.latitude),
      lng: String(position.coords.longitude),
    });
    const response = await fetch(`/api/events/nearby?${params}`);
    if (!response.ok) throw new Error("Could not load events near you.");

    setState((await response.json()) as Located);
  });

  const mapHref = `/organizers/${organizerSlug}/map`;
  const browseAll = (
    <Button asChild variant="outline" size="md">
      <Link href={mapHref}>
        <MapIcon /> Discover all on the map
      </Link>
    </Button>
  );

  // Still asking the edge. Showing "use my location" here and then replacing it
  // a moment later would read as a glitch, so hold the shape instead.
  if (!settled) {
    return (
      <section data-testid="nearby-events" className="mt-12 space-y-4">
        <SectionHeader level={2} title="Events near you" />
        <Card className="h-40 animate-pulse bg-sunken" aria-busy />
      </section>
    );
  }

  // Case 3 — location unknown.
  if (!state || !state.viewer) {
    return (
      <section data-testid="nearby-events" className="mt-12 space-y-4">
        <SectionHeader
          level={2}
          title="Events near you"
          description={`Find out which of ${organizerName}'s events are closest.`}
        />
        <Card className="flex flex-col items-center gap-4 px-6 py-10 text-center">
          <Compass className="size-6 text-ink-3" aria-hidden />
          <p className="max-w-sm text-sm leading-relaxed text-ink-2">
            {denied
              ? "No problem — you can still see every location on the map."
              : "Share your location and we'll show what's on close to you."}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {!denied && (
              <Button variant="primary" size="md" loading={locate.pending} onClick={() => locate.run()}>
                <MapPin /> Use my location
              </Button>
            )}
            {browseAll}
          </div>
          {locate.error && <p className="text-xs text-critical">{locate.error}</p>}
        </Card>
      </section>
    );
  }

  // Case 2 — located, but nothing within the radius.
  if (state.pins.length === 0) {
    return (
      <section data-testid="nearby-events" className="mt-12 space-y-4">
        <SectionHeader level={2} title="Events near you" />
        <Callout
          tone="info"
          title={`Nothing from ${organizerName} within ${state.radiusKm} km`}
          action={browseAll}
        >
          {state.label
            ? `We looked around ${state.label} and found no upcoming events from this organizer.`
            : "We found no upcoming events from this organizer near you."}
        </Callout>
      </section>
    );
  }

  // Case 1 — located, with results.
  const closest = formatDistance(state.pins[0].distance_km);

  return (
    <section data-testid="nearby-events" className="mt-12 space-y-4">
      <SectionHeader
        level={2}
        title="Events near you"
        description={
          state.label
            ? `${state.pins.length} upcoming near ${state.label}${closest ? ` · closest ${closest}` : ""}`
            : `${state.pins.length} upcoming near you`
        }
        action={browseAll}
      />
      {/*
        The map is its own object and each result is its own row, rather than a
        map with a bordered list welded to its bottom edge: it matches how every
        other list on the site is built, and the rows keep their hover.
      */}
      <div className="overflow-hidden rounded-2xl bg-card shadow-e1">
        <EventMap pins={state.pins} viewer={state.viewer} className="h-80" />
      </div>

      <ul className="space-y-1">
        {state.pins.slice(0, 3).map((pin) => (
          <li key={pin.id}>
            <Link
              href={`/events/${pin.slug}`}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-sunken"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-sunken text-ink-2">
                <MapPin className="size-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1 truncate font-flourish text-lg text-ink">
                {pin.title}
              </span>
              <span className="shrink-0 text-sm tnum text-ink-3">
                {formatDistance(pin.distance_km)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
