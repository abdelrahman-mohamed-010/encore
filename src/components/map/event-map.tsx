"use client";

import * as React from "react";
import "leaflet/dist/leaflet.css";
import { Minus, Plus } from "lucide-react";
import type { Map as LeafletMap, Marker as LeafletMarker, TileLayer as LeafletTileLayer } from "leaflet";
import { useTheme } from "@/contexts/theme-context";
import { cn } from "@/lib/utils";
import type { EventPin } from "@/lib/types";

/**
 * OpenStreetMap & CartoDB tiles (100% open-source, free, no API key required).
 */
const TILE_URLS = {
  light: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
};

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
    const key = `${pin.latitude.toFixed(precision)},${pin.longitude.toFixed(precision)}`;
    const existing = groups.get(key);
    if (existing) {
      existing.events.push(pin);
    } else {
      groups.set(key, {
        key,
        latitude: pin.latitude,
        longitude: pin.longitude,
        events: [pin],
      });
    }
  }

  return [...groups.values()];
}

function markerElement(group: PinGroup, selected: boolean) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = "tz-marker";
  el.dataset.selected = selected ? "true" : "false";
  el.dataset.count = String(group.events.length);
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
  viewer?: { latitude: number; longitude: number } | null;
  className?: string;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<LeafletMap | null>(null);
  const tileLayerRef = React.useRef<LeafletTileLayer | null>(null);
  const markersRef = React.useRef<LeafletMarker[]>([]);
  const [mapReady, setMapReady] = React.useState(false);

  const { resolved } = useTheme();
  const selectRef = React.useRef(onSelect);
  React.useEffect(() => {
    selectRef.current = onSelect;
  }, [onSelect]);

  const groups = React.useMemo(() => groupPins(pins), [pins]);

  // --- Initialize Leaflet Map --------------------------------------------
  React.useEffect(() => {
    let cancelled = false;
    let mapInstance: LeafletMap | null = null;

    (async () => {
      try {
        const L = (await import("leaflet")).default;
        if (cancelled || !containerRef.current) return;

        // Create Leaflet map instance
        mapInstance = L.map(containerRef.current, {
          center: [30.0444, 31.2357],
          zoom: 10,
          zoomControl: false,
          scrollWheelZoom: false,
          attributionControl: true,
        });

        // Add open-source raster tiles
        const isDark = resolved === "dark";
        const layer = L.tileLayer(isDark ? TILE_URLS.dark : TILE_URLS.light, {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }).addTo(mapInstance);

        tileLayerRef.current = layer;
        mapRef.current = mapInstance;

        if (!cancelled) {
          setMapReady(true);
        }
      } catch (err) {
        console.error("Failed to initialize map:", err);
      }
    })();

    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      mapInstance?.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Theme Change: Update tile layer url -------------------------------
  React.useEffect(() => {
    if (!tileLayerRef.current) return;
    const isDark = resolved === "dark";
    tileLayerRef.current.setUrl(isDark ? TILE_URLS.dark : TILE_URLS.light);
  }, [resolved]);

  // --- Draw markers & frame bounds ----------------------------------------
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapRef.current) return;

      // Remove existing markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const newMarkers: LeafletMarker[] = [];

      // Add event markers
      groups.forEach((group) => {
        const isSelected = group.events.some((e) => e.id === selectedId);
        const el = markerElement(group, isSelected);

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          selectRef.current?.(group.events[0]);
        });

        const icon = L.divIcon({
          html: el,
          className: "!bg-transparent !border-0",
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([group.latitude, group.longitude], { icon }).addTo(map);
        newMarkers.push(marker);
      });

      // Add viewer "you are here" dot if known
      if (viewer) {
        const dot = document.createElement("div");
        dot.className = "tz-viewer-dot";
        dot.setAttribute("aria-hidden", "true");

        const icon = L.divIcon({
          html: dot,
          className: "!bg-transparent !border-0",
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        const viewerMarker = L.marker([viewer.latitude, viewer.longitude], { icon }).addTo(map);
        newMarkers.push(viewerMarker);
      }

      markersRef.current = newMarkers;

      // Fit bounds
      if (groups.length === 1 && !viewer) {
        map.setView([groups[0].latitude, groups[0].longitude], 13);
      } else if (groups.length > 0) {
        const points: [number, number][] = groups.map((g) => [g.latitude, g.longitude]);
        if (viewer) points.push([viewer.latitude, viewer.longitude]);
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [groups, viewer, mapReady, selectedId]);

  // --- Reflect selection update without rebuilding map ---------------------
  React.useEffect(() => {
    const selectedKey = selectedId
      ? groups.find((g) => g.events.some((e) => e.id === selectedId))?.key
      : undefined;

    markersRef.current.forEach((marker) => {
      const el = marker.getElement()?.querySelector(".tz-marker") as HTMLElement | null;
      if (!el || !el.dataset.group) return;
      el.dataset.selected = el.dataset.group === selectedKey ? "true" : "false";
    });
  }, [selectedId, groups]);

  return (
    <div className={cn("relative isolate overflow-hidden bg-sunken", className)}>
      <div ref={containerRef} className="size-full" data-testid="event-map" />

      {!mapReady && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="text-sm text-ink-3">Loading map…</span>
        </div>
      )}

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-3 z-[1000] flex flex-col overflow-hidden rounded-lg bg-card shadow-e1">
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
