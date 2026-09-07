import { cn } from "@/lib/utils";

/**
 * Loading placeholders.
 *
 * These are never used for a whole page. A route-level loading.tsx sits at the
 * segment boundary and swaps out everything below it, so the heading, the
 * filters, the search box and the table header — none of which are waiting on
 * anything — get replaced too. Instead each piece of the page that actually
 * fetches is wrapped in its own <Suspense>, and only that piece falls back to
 * one of these while its query runs.
 *
 * The shapes follow one rule: a placeholder is a single block at the real
 * element's footprint and radius, never a reconstruction of its insides. A card
 * standing in for a card is one rectangle, not a bordered box containing five
 * smaller grey boxes — that is a second copy of the layout, and it drifts.
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
 * Rows for a table or list whose header, filters and surface are already on
 * screen. One block per row at the real row height, nothing else.
 */
export function SkeletonRows({
  rows = 8,
  height = "h-14",
  className,
}: {
  rows?: number;
  height?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={cn("w-full rounded-xl", height)} />
      ))}
    </div>
  );
}

/** Cards in a grid: one block each, at the card's own size and radius. */
export function SkeletonCards({
  count = 6,
  className,
  itemClassName = "min-h-96 rounded-2xl",
}: {
  count?: number;
  className?: string;
  itemClassName?: string;
}) {
  return (
    <div className={cn("grid gap-5 sm:grid-cols-2 lg:grid-cols-3", className)} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={cn("h-full", itemClassName)} />
      ))}
    </div>
  );
}
