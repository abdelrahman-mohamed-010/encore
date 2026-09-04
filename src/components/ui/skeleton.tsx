import { cn } from "@/lib/utils";

/**
 * Skeletons mirror the real layout — same heights, same gaps — so the page does
 * not jump when the content arrives. Each route's loading.tsx composes these,
 * which is what lets navigation paint immediately instead of waiting on data.
 */
export function Shimmer({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
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

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Shimmer key={i} className={cn("h-3.5", i === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-card">
      <Shimmer className="aspect-[16/10] rounded-none" />
      <div className="space-y-3 p-4">
        <div className="flex gap-3">
          <Shimmer className="size-12 shrink-0" />
          <div className="flex-1 space-y-2">
            <Shimmer className="h-3.5 w-4/5" />
            <Shimmer className="h-3 w-1/2" />
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-hairline-soft pt-3">
          <Shimmer className="h-3 w-2/5" />
          <Shimmer className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}

export function EventGridSkeleton({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-5 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function EventRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-hairline bg-card p-3">
      <Shimmer className="size-16 shrink-0" />
      <div className="flex-1 space-y-2">
        <Shimmer className="h-2.5 w-24" />
        <Shimmer className="h-3.5 w-3/5" />
        <Shimmer className="h-2.5 w-2/5" />
      </div>
      <Shimmer className="h-3.5 w-12" />
    </div>
  );
}

export function StatTileSkeleton() {
  return (
    <div className="rounded-xl border border-hairline bg-card p-4">
      <div className="flex items-center justify-between">
        <Shimmer className="h-3 w-24" />
        <Shimmer className="size-7 rounded-md" />
      </div>
      <Shimmer className="mt-3 h-7 w-28" />
      <Shimmer className="mt-2 h-2.5 w-20" />
    </div>
  );
}

export function StatRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <StatTileSkeleton key={i} />
      ))}
    </div>
  );
}

export function ChartSkeleton({ title }: { title?: boolean }) {
  return (
    <div className="rounded-xl border border-hairline bg-card">
      {title && (
        <div className="border-b border-hairline-soft px-5 py-4">
          <Shimmer className="h-3.5 w-24" />
          <Shimmer className="mt-2 h-2.5 w-32" />
        </div>
      )}
      <div className="p-5">
        <Shimmer className="h-7 w-32" />
        <div className="mt-5 flex h-[220px] items-end gap-2">
          {Array.from({ length: 14 }).map((_, i) => (
            <Shimmer
              key={i}
              className="flex-1 rounded-t-md"
              style={{ height: `${35 + ((i * 37) % 60)}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 8, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-card">
      <div className="flex gap-4 border-b border-hairline px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Shimmer key={i} className="h-2.5 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex items-center gap-4 border-b border-hairline-soft px-4 py-4 last:border-b-0">
          {Array.from({ length: columns }).map((_, col) => (
            <Shimmer key={col} className={cn("h-3.5 flex-1", col === 0 && "max-w-40")} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-card">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-hairline-soft px-4 py-4 last:border-b-0">
          <Shimmer className="size-12 shrink-0" />
          <div className="flex-1 space-y-2">
            <Shimmer className="h-3.5 w-2/5" />
            <Shimmer className="h-2.5 w-1/4" />
          </div>
          <Shimmer className="h-5 w-16 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="rounded-xl border border-hairline bg-card">
      <div className="border-b border-hairline-soft px-5 py-4">
        <Shimmer className="h-3.5 w-28" />
        <Shimmer className="mt-2 h-2.5 w-56" />
      </div>
      <div className="space-y-5 p-5">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Shimmer className="h-2.5 w-20" />
            <Shimmer className="h-10 w-full" />
          </div>
        ))}
      </div>
      <div className="flex justify-end border-t border-hairline-soft px-5 py-3.5">
        <Shimmer className="h-10 w-32" />
      </div>
    </div>
  );
}

export function PageHeaderSkeleton({ withAction = true }: { withAction?: boolean }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-2.5">
        <Shimmer className="h-7 w-48" />
        <Shimmer className="h-3.5 w-72" />
      </div>
      {withAction && <Shimmer className="h-10 w-32" />}
    </div>
  );
}
