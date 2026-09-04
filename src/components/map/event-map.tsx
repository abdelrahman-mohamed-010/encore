"use client";

import * as React from "react";
import type { Map as MapLibreMap, Marker as MapLibreMarker } from "maplibre-gl";
// MapLibre positions its own markers and controls; without this they stack in
// the top-left corner instead of over their coordinates.
import "maplibre-gl/dist/maplibre-gl.css";
import { Minus, Plus } from "lucide-react";
import { useTheme } from "@/contexts/theme-context";
import { cn } from "@/lib/utils";
import type { EventPin } from "@/lib/types";

/**
 * The map surface.
 *
 * Markers are real DOM elements rather than canvas layers, which is a
 * deliberate trade: canvas clustering scales to millions of points, but DOM
 * markers can be styled with our own tokens, focused with a keyboard, read by a
 * screen reader and asserted on in a test. At the few hundred events one view
 * ever shows, that is the better bargain.
 *
 * Everything here degrades: if WebGL is unavailable or the tile host cannot be
 * reached, the surrounding list is still the real content and the page works.
 */

const STYLES = {
  // OpenFreeMap: no API key, no signup, no request cap. Override per
  // environment if you would rather point at your own tile provider.
  light: process.env.NEXT_PUBLIC_MAP_STYLE_LIGHT ?? "https://tiles.openfreemap.org/styles/bright",
  dark: process.env.NEXT_PUBLIC_MAP_STYLE_DARK ?? "https://tiles.openfreemap.org/styles/dark",
};

/** Pins sharing a spot become one marker with a count, as on any map app. */
export type PinGroup = {
  key: string;
  latitude: number;
  longitude: number;
  events: EventPin[];
};

export function groupPins(pins: EventPin[], precision = 4): PinGroup[] {
  const groups = new Map<string, PinGroup>();

  for (const pin of pins) {
    if (pin.latitude === null || pin.longitude === null) continue;
    // Rounding to ~11m at precision 4 merges pins at the same venue while
    // keeping genuinely different addresses apart.
    const key = `${pin.latitude.toFixed(precision)},${pin.longitude.toFixed(precision)}`;
    const existing = groups.get(key);
    if (existing) existing.events.push(pin);
    else
      groups.set(key, {
        key,
        latitude: pin.latitude,
        longitude: pin.longitude,
        events: [pin],
      });
  }

  return [...groups.values()];
}

function markerElement(group: PinGroup, selected: boolean) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = "tz-marker";
  el.dataset.selected = selected ? "true" : "false";
  el.dataset.count = String(group.events.length);
  // The key is how the selection effect finds this element again without
  // rebuilding every marker.
  el.dataset.group = group.key;
  el.setAttribute(
    "aria-label",
    group.events.length === 1
      ? group.events[0].title
      : `${group.events.length} events at ${group.events[0].venue_name ?? "this location"}`,
  );
  el.textContent = group.events.length > 1 ? String(group.events.length) : "";
  return el;
}

export function EventMap({
  pins,
  selectedId,
  onSelect,
  viewer,
  className,
}: {
  pins: EventPin[];
  selectedId?: string | null;
  onSelect?: (event: EventPin) => void;
  /** Draws a "you are here" dot when the viewer's location is known. */
  viewer?: { latitude: number; longitude: number } | null;
  className?: string;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<MapLibreMap | null>(null);
  const markersRef = React.useRef<MapLibreMarker[]>([]);
  const [failed, setFailed] = React.useState(false);

  /**
   * The instance lives in state, not only in a ref, because the marker effect
   * has to re-run once the map exists. Creation is async, so on first render
   * there is nothing to attach markers to; a ref would leave that effect
   * having bailed out with no reason to try again.
   */
  const [map, setMap] = React.useState<MapLibreMap | null>(null);

  const { resolved } = useTheme();

  // Selection and the click handler are read through refs so that changing
  // either does not tear down and rebuild the map.
  const selectRef = React.useRef(onSelect);
  React.useEffect(() => {
    selectRef.current = onSelect;
  }, [onSelect]);

  const groups = React.useMemo(() => groupPins(pins), [pins]);

  // --- Create the map once -------------------------------------------------
  React.useEffect(() => {
    let cancelled = false;
    let created: MapLibreMap | null = null;

    (async () => {
      try {
        // Loaded lazily: MapLibre is ~800 KB and must never enter the bundle
        // of a page that only links to a map.
        const maplibre = await import("maplibre-gl");
        if (cancelled || !containerRef.current) return;

        created = new maplibre.Map({
          container: containerRef.current,
          style: STYLES[resolved === "dark" ? "dark" : "light"],
          center: [31.2357, 30.0444],
          zoom: 9,
          attributionControl: { compact: true },
          // The page scrolls; grabbing the wheel would trap the reader.
          scrollZoom: false,
        });

        created.on("error", () => {
          // A tile that fails to load is not fatal: markers are DOM overlays
          // and still sit at the right coordinates over an empty background.
          // Publishing readiness off "load" would strand the map here, because
          // that event never fires when the style request fails.
        });

        mapRef.current = created;
        if (!cancelled) setMap(created);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      created?.remove();
      mapRef.current = null;
      setMap(null);
    };
    // Restyling on theme change is handled below, not by rebuilding the map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Follow the theme ----------------------------------------------------
  React.useEffect(() => {
    mapRef.current?.setStyle(STYLES[resolved === "dark" ? "dark" : "light"]);
  }, [resolved]);

  // --- Draw markers, and frame them ---------------------------------------
  React.useEffect(() => {
    if (!map) return;

    let cancelled = false;

    (async () => {
      const maplibre = await import("maplibre-gl");
      if (cancelled) return;

      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = groups.map((group) => {
        const el = markerElement(group, group.events.some((e) => e.id === selectedId));
        el.addEventListener("click", (event) => {
          event.stopPropagation();
          selectRef.current?.(group.events[0]);
        });
        return new maplibre.Marker({ element: el })
          .setLngLat([group.longitude, group.latitude])
          .addTo(map);
      });

      if (viewer) {
        const dot = document.createElement("div");
        dot.className = "tz-viewer-dot";
        dot.setAttribute("aria-hidden", "true");
        markersRef.current.push(
          new maplibre.Marker({ element: dot })
            .setLngLat([viewer.longitude, viewer.latitude])
            .addTo(map),
        );
      }

      // Frame everything the viewer needs to see. A single pin with a known
      // viewer still has to be framed rather than centred: zooming to the pin
      // alone pushes the "you are here" dot off-screen, which is exactly the
      // context that makes "7.8 km away" mean anything.
      if (groups.length === 1 && !viewer) {
        map.jumpTo({ center: [groups[0].longitude, groups[0].latitude], zoom: 13 });
      } else if (groups.length > 0) {
        const bounds = new maplibre.LngLatBounds();
        groups.forEach((g) => bounds.extend([g.longitude, g.latitude]));
        if (viewer) bounds.extend([viewer.longitude, viewer.latitude]);
        map.fitBounds(bounds, { padding: 64, maxZoom: 14, animate: false });
      }
    })();

    return () => {
      cancelled = true;
    };
    // `map` is the dependency that matters: creation is async, so this effect
    // must re-run once the instance exists. `selectedId` is read for the
    // initial highlight only; live changes go through the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, groups, viewer]);

  // --- Reflect the selection without redrawing every marker ---------------
  React.useEffect(() => {
    const selectedKey = selectedId
      ? groups.find((g) => g.events.some((e) => e.id === selectedId))?.key
      : undefined;

    markersRef.current.forEach((marker) => {
      const el = marker.getElement();
      if (!el.dataset.group) return; // the viewer dot, not a pin
      el.dataset.selected = el.dataset.group === selectedKey ? "true" : "false";
    });
  }, [selectedId, groups]);

  if (failed) return null;

  return (
    <div className={cn("relative isolate overflow-hidden bg-sunken", className)}>
      <div ref={containerRef} className="size-full" data-testid="event-map" />

      {/* Only while the library itself is still being fetched. Once the map
          exists the markers are placed, whether or not the tiles arrived. */}
      {!map && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="text-sm text-ink-3">Loading map…</span>
        </div>
      )}

      <div className="absolute bottom-4 right-3 z-10 flex flex-col overflow-hidden rounded-lg border border-hairline bg-card shadow-e2">
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => mapRef.current?.zoomIn()}
          className="grid size-8 place-items-center text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
        >
          <Plus className="size-4" />
        </button>
        <span className="h-px bg-hairline" aria-hidden />
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => mapRef.current?.zoomOut()}
          className="grid size-8 place-items-center text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
        >
          <Minus className="size-4" />
        </button>
      </div>
    </div>
  );
}
