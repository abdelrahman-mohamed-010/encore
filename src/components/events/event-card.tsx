import Image from "next/image";
import Link from "next/link";
import { MapPin, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DateBlock } from "@/components/ui/field-row";
import { Shimmer } from "@/components/ui/skeleton";
import { formatEventStamp, priceRange } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EventSearchResult } from "@/lib/types";

function placeLabel(event: EventSearchResult) {
  if (event.is_online) return "Online event";
  return [event.venue_name, event.city].filter(Boolean).join(" · ") || "Location to be announced";
}

/** Vertical card, used in grids. */
export function EventCard({
  event,
  priority = false,
  className,
}: {
  event: EventSearchResult;
  priority?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl bg-card shadow-e1",
        "transition-shadow duration-300 ease-out-quint hover:shadow-e2",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-sunken">
        {event.cover_image_url ? (
          <Image
            src={event.cover_image_url}
            alt=""
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="size-full bg-gradient-to-br from-sunken to-sunken-2" />
        )}

        {/* Subtle gradient for badge readability */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/30 to-transparent" />

        <div className="absolute left-3 top-3 flex gap-1.5">
          {event.is_featured && (
            <Badge tone="solid" size="sm">Featured</Badge>
          )}
          {event.is_sold_out && (
            <Badge tone="critical" size="sm">Sold out</Badge>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start gap-3.5">
          <DateBlock date={event.starts_at} timeZone={event.timezone ?? undefined} />
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 font-flourish text-xl leading-tight text-ink">
              {event.title}
            </h3>
            <p className="mt-1.5 truncate text-sm text-ink-3">
              {formatEventStamp(event.starts_at, event.timezone ?? undefined)}
            </p>
          </div>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-1">
          <span className="flex min-w-0 items-center gap-1.5 text-sm text-ink-3">
            {event.is_online ? (
              <Video className="size-4 shrink-0" />
            ) : (
              <MapPin className="size-4 shrink-0" />
            )}
            <span className="truncate">{placeLabel(event)}</span>
          </span>
          <span className="shrink-0 text-base font-semibold tabular text-ink">
            {priceRange(event.min_price_cents, event.max_price_cents, event.currency)}
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Horizontal row, used in dense lists and sidebars. */
export function EventRow({
  event,
  className,
}: {
  event: EventSearchResult;
  className?: string;
}) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className={cn(
        "group flex items-center gap-4 rounded-xl p-2.5 transition-colors hover:bg-sunken",
        className,
      )}
    >
      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-sunken">
        {event.cover_image_url && (
          <Image
            src={event.cover_image_url}
            alt=""
            fill
            sizes="56px"
            className="object-cover"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-ink-3">
          {formatEventStamp(event.starts_at, event.timezone ?? undefined)}
        </p>
        <h3 className="mt-0.5 truncate font-flourish text-lg text-ink">{event.title}</h3>
        <p className="mt-0.5 truncate text-xs text-ink-3">{placeLabel(event)}</p>
      </div>

      <span className="shrink-0 text-sm font-semibold tabular text-ink">
        {event.is_sold_out
          ? "Sold out"
          : priceRange(event.min_price_cents, event.max_price_cents, event.currency)}
      </span>
    </Link>
  );
}


export function EventCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl", className)}>
      <Shimmer className="aspect-[4/3] rounded-none" />
      <Shimmer className="mt-3 h-24 rounded-2xl" />
    </div>
  );
}
