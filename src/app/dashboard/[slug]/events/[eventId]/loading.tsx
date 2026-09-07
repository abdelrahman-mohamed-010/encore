import { Shimmer } from "@/components/ui/skeleton";

/**
 * The layout already renders the header and tabs, so this only stands in for
 * the pane below them — the shape the overview settles into.
 */
export default function ManageEventLoading() {
  return (
    <div className="space-y-10 px-5 py-8 md:px-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Shimmer key={i} className="h-[4.25rem] rounded-xl" />
        ))}
      </div>

      <div className="rounded-2xl bg-card p-4 shadow-e1">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          <Shimmer className="h-72 rounded-xl" />
          <div className="space-y-6">
            <Shimmer className="h-5 w-40" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Shimmer className="size-[46px] shrink-0 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Shimmer className="h-4 w-48" />
                  <Shimmer className="h-3.5 w-32" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Shimmer className="h-20 rounded-xl" />
    </div>
  );
}
