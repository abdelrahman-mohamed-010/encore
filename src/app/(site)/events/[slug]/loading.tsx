import { Shimmer, SkeletonText } from "@/components/ui/skeleton";

export default function EventDetailLoading() {
  return (
    <div className="container-page py-8 md:py-12">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-14">
        <div>
          <Shimmer className="aspect-square rounded-2xl" />
          <div className="mt-5 space-y-4">
            <Shimmer className="h-2.5 w-20" />
            <div className="flex items-center gap-3">
              <Shimmer className="size-9 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Shimmer className="h-3.5 w-32" />
                <Shimmer className="h-2.5 w-24" />
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <Shimmer className="h-6 w-24 rounded-full" />
          <Shimmer className="mt-4 h-12 w-4/5" />
          <Shimmer className="mt-3 h-5 w-3/5" />

          <div className="mt-7 overflow-hidden rounded-xl bg-card shadow-e1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3.5 border-b border-hairline-soft px-4 py-3.5 last:border-b-0">
                <Shimmer className="size-9 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Shimmer className="h-2.5 w-32" />
                  <Shimmer className="h-3.5 w-48" />
                </div>
              </div>
            ))}
          </div>

          <Shimmer className="mt-10 h-7 w-28" />
          <div className="mt-4 overflow-hidden rounded-xl bg-card shadow-e1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b border-hairline-soft px-4 py-4 last:border-b-0">
                <div className="flex-1 space-y-2">
                  <Shimmer className="h-3.5 w-40" />
                  <Shimmer className="h-2.5 w-24" />
                </div>
                <Shimmer className="h-8 w-28 rounded-md" />
              </div>
            ))}
          </div>

          <Shimmer className="mt-10 h-7 w-40" />
          <SkeletonText lines={5} className="mt-4" />
        </div>
      </div>
    </div>
  );
}
