import Image from "next/image";
import Link from "next/link";
import { MapPin, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DateBlock } from "@/components/ui/field-row";
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
        "group flex h-full flex-col overflow-hidden rounded-xl border border-hairline bg-card",
        "transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-n-300 dark:hover:border-n-700",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-sunken">
        {event.cover_image_url ? (
          <Image
            src={event.cover_image_url}
            alt=""
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="size-full bg-gradient-to-br from-n-100 to-n-200 dark:from-n-800 dark:to-n-900" />
        )}

        <div className="absolute left-3 top-3 flex gap-1.5">
          {event.is_featured && (
            <Badge tone="solid" size="sm" pill>Featured</Badge>
          )}
          {event.is_sold_out && (
            <Badge tone="critical" size="sm" pill>Sold out</Badge>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <DateBlock date={event.starts_at} timeZone={event.timezone ?? undefined} />
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-[-0.015em] text-ink">
              {event.title}
            </h3>
            <p className="mt-1 truncate text-[12.5px] text-ink-3">
              {formatEventStamp(event.starts_at, event.timezone ?? undefined)}
            </p>
          </div>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-hairline-soft pt-3">
          <span className="flex min-w-0 items-center gap-1.5 text-[12.5px] text-ink-3">
            {event.is_online ? (
              <Video className="size-3.5 shrink-0" />
            ) : (
              <MapPin className="size-3.5 shrink-0" />
            )}
            <span className="truncate">{placeLabel(event)}</span>
          </span>
          <span className="shrink-0 text-[13px] font-semibold tabular text-ink">
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
        "group flex items-center gap-4 rounded-xl border border-hairline bg-card p-3 transition-colors hover:bg-sunken",
        className,
      )}
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-sunken">
        {event.cover_image_url && (
          <Image
            src={event.cover_image_url}
            alt=""
            fill
            sizes="64px"
            className="object-cover"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium text-ink-3">
          {formatEventStamp(event.starts_at, event.timezone ?? undefined)}
        </p>
        <h3 className="mt-0.5 truncate text-[14px] font-semibold text-ink">{event.title}</h3>
        <p className="mt-0.5 truncate text-[12.5px] text-ink-3">{placeLabel(event)}</p>
      </div>

      <span className="shrink-0 text-[13px] font-semibold tabular text-ink">
        {event.is_sold_out
          ? "Sold out"
          : priceRange(event.min_price_cents, event.max_price_cents, event.currency)}
      </span>
    </Link>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-card">
      <div className="aspect-[16/10] animate-pulse bg-sunken" />
      <div className="space-y-3 p-4">
        <div className="flex gap-3">
          <div className="size-12 shrink-0 animate-pulse rounded-lg bg-sunken" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-4/5 animate-pulse rounded bg-sunken" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-sunken" />
          </div>
        </div>
        <div className="h-3 w-2/3 animate-pulse rounded bg-sunken" />
      </div>
    </div>
  );
}
