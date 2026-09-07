import { cn } from "@/lib/utils";

/**
 * Loading placeholders.
 *
 * Three rules, and they are what keep this from turning back into a second,
 * worse copy of the UI:
 *
 * 1. **One block per thing.** A card's placeholder is a single rectangle at the
 *    card's own footprint and radius — never a card containing smaller grey
 *    rectangles. Drawing the inside of a component you are about to replace
 *    duplicates its layout, and the duplicate drifts the moment the real one
 *    changes.
 * 2. **Only what is actually waiting.** Headings, filters, search boxes, tabs
 *    and table headers do not come from the database, so they render straight
 *    away and stay put. Placeholders belong around the rows and cells alone.
 * 3. **Same box as the real thing.** Matching height and radius means the page
 *    does not reflow when the content lands.
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn("relative overflow-hidden rounded-lg bg-sunken", className)}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/[0.05] to-transparent dark:via-white/[0.06] [animation:sweep_1.6s_infinite]" />
    </div>
  );
}

/**
 * Rows inside a surface that is already on screen — a table body under its real
 * header, a list inside its real card. One block per row, no chrome of its own.
 */
export function SkeletonRows({
  rows = 8,
  height = "h-12",
  className,
}: {
  rows?: number;
  /** Match the real row's height so the table does not jump. */
  height?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-px", className)} aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={cn("w-full rounded-none", height)} />
      ))}
    </div>
  );
}

/** A grid of equal blocks, for any collection of cards. */
export function SkeletonGrid({
  count = 6,
  className,
  itemClassName,
}: {
  count?: number;
  className?: string;
  itemClassName?: string;
}) {
  return (
    <div className={cn("grid gap-5 sm:grid-cols-2 lg:grid-cols-3", className)} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={cn("h-full min-h-64 rounded-2xl", itemClassName)} />
      ))}
    </div>
  );
}

/**
 * The event card's own footprint: 4:3 artwork above a two-line block, at the
 * card's rounded-2xl. One rectangle, not a facsimile of the card.
 */
export function EventCardSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-full min-h-96 rounded-2xl", className)} />;
}

export function EventGridSkeleton({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-5 sm:grid-cols-2 lg:grid-cols-3", className)} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Dashboard metric tiles, at the tile's real height and radius. */
export function StatRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-[6.5rem] rounded-xl" />
      ))}
    </div>
  );
}

/** A chart's plot area. The card and its title are real and already drawn. */
export function ChartSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-[17rem] rounded-xl", className)} />;
}
