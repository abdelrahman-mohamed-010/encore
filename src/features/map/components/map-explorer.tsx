"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, CalendarDays, MapPin, X } from "lucide-react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { EventMap } from "@/features/map/components/event-map";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/misc";
import { useMediaQuery } from "@/hooks/use-media-query";
import { formatDateTime, formatMoney } from "@/lib/format";
import { formatDistance } from "@/lib/geo";
import { cn } from "@/lib/utils";
import type { EventPin } from "@/lib/types";

/**
 * List on one side, map on the other, selection shared between them. Clicking
 * either a row or a pin selects the event; the list is the primary content and
 * works on its own if the map never loads.
 */

function priceLabel(pin: EventPin) {
  if (pin.is_sold_out) return "Sold out";
  if (pin.min_price_cents === null) return null;
  return pin.min_price_cents === 0 ? "Free" : `From ${formatMoney(pin.min_price_cents, pin.currency ?? "USD")}`;
}

function EventRow({
  pin,
  selected,
  onSelect,
}: {
  pin: EventPin;
  selected: boolean;
  onSelect: () => void;
}) {
  const price = priceLabel(pin);
  const distance = formatDistance(pin.distance_km);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "flex w-full gap-3 border-b border-hairline-soft px-4 py-3.5 text-left transition-colors",
        "hover:bg-sunken focus-visible:outline-none focus-visible:bg-sunken",
        selected && "bg-sunken",
      )}
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-hairline bg-sunken">
        {pin.cover_image_url && (
          <Image
            src={pin.cover_image_url}
            alt=""
            fill
            sizes="64px"
            className="object-cover"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs text-ink-3">
          {formatDateTime(pin.starts_at, pin.timezone ?? undefined)}
        </p>
        <p className="mt-0.5 truncate text-base font-semibold text-ink">{pin.title}</p>
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-ink-3">
          <MapPin className="size-3 shrink-0" aria-hidden />
          {pin.venue_name ?? pin.city}
          {distance && <span className="shrink-0"> · {distance}</span>}
        </p>
        {price && (
          <Badge tone={pin.is_sold_out ? "critical" : "positive"} size="xs" className="mt-1.5">
            {price}
          </Badge>
        )}
      </div>
    </button>
  );
}

function DetailPanel({ pin, onBack }: { pin: EventPin; onBack: () => void }) {
  const price = priceLabel(pin);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-hairline-soft px-4 py-2.5">
        <Button variant="ghost" size="sm" onClick={onBack}>
          Back
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={onBack}>
          <X />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-hairline bg-sunken">
          {pin.cover_image_url && (
            <Image src={pin.cover_image_url} alt="" fill sizes="360px" className="object-cover" />
          )}
        </div>

        <h2 className="display-3 mt-4 text-ink">{pin.title}</h2>
        <p className="mt-1 text-sm text-ink-3">Hosted by {pin.organizer_name}</p>

        <dl className="mt-4 space-y-3">
          <div className="flex gap-3">
            <dt className="mt-0.5"><CalendarDays className="size-4 text-ink-3" aria-hidden /></dt>
            <dd className="text-sm text-ink">
              {formatDateTime(pin.starts_at, pin.timezone ?? undefined)}
            </dd>
          </div>
          <div className="flex gap-3">
            <dt className="mt-0.5"><MapPin className="size-4 text-ink-3" aria-hidden /></dt>
            <dd className="text-sm text-ink">
              <span className="font-medium">{pin.venue_name}</span>
              {pin.venue_address && (
                <span className="block text-ink-3">{pin.venue_address}</span>
              )}
              {formatDistance(pin.distance_km) && (
                <span className="block text-ink-3">{formatDistance(pin.distance_km)}</span>
              )}
            </dd>
          </div>
        </dl>

        {price && (
          <p className="mt-4 numeral text-xl font-semibold text-ink">{price}</p>
        )}
      </div>

      <div className="border-t border-hairline-soft p-4">
        <Button asChild variant="primary" block>
          <Link href={`/events/${pin.slug}`}>
            Get tickets <ArrowUpRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function MapExplorer({
  pins,
  viewer,
  emptyMessage = "No events to place on the map yet.",
  className,
}: {
  pins: EventPin[];
  viewer?: { latitude: number; longitude: number } | null;
  emptyMessage?: string;
  className?: string;
}) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const selected = pins.find((pin) => pin.id === selectedId) ?? null;
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const drawerContent = (
    <div data-testid="map-list" className="flex h-full min-h-0 flex-col bg-paper">
      {pins.length === 0 ? (
        <div className="p-4">
          <EmptyState icon={MapPin} title="Nothing on the map" description={emptyMessage} />
        </div>
      ) : selected ? (
        <DetailPanel pin={selected} onBack={() => setSelectedId(null)} />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {pins.map((pin) => (
            <EventRow
              key={pin.id}
              pin={pin}
              selected={pin.id === selectedId}
              onSelect={() => setSelectedId(pin.id)}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className={cn("relative min-h-0 h-full w-full overflow-hidden", className)}>
      <Group
        id="map-explorer-split"
        orientation={isDesktop ? "horizontal" : "vertical"}
        className="h-full w-full"
      >
        <Panel
          id="drawer-panel"
          defaultSize={isDesktop ? "360px" : "45%"}
          minSize={isDesktop ? "280px" : "25%"}
          maxSize={isDesktop ? "650px" : "75%"}
          className="flex min-h-0 flex-col overflow-hidden bg-paper"
        >
          {drawerContent}
        </Panel>

        <Separator
          className={cn(
            "group relative flex shrink-0 items-center justify-center bg-hairline-soft/80 transition-colors hover:bg-brand-500/20 active:bg-brand-500/30",
            isDesktop
              ? "w-2 cursor-col-resize hover:w-2.5"
              : "h-2 cursor-row-resize hover:h-2.5",
          )}
        >
          <div
            className={cn(
              "rounded-full bg-ink-3/40 transition-all group-hover:bg-brand-600 group-active:bg-brand-600",
              isDesktop ? "h-8 w-1 group-hover:h-12" : "h-1 w-8 group-hover:w-12",
            )}
          />
        </Separator>

        <Panel id="map-panel" minSize={isDesktop ? "35%" : "25%"} className="min-h-0 flex-1">
          <EventMap
            pins={pins}
            selectedId={selectedId}
            onSelect={(pin) => setSelectedId(pin.id)}
            viewer={viewer}
            className="h-full w-full min-h-0"
          />
        </Panel>
      </Group>
    </div>
  );
}
