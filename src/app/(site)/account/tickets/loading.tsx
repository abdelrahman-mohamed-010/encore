import { Shimmer } from "@/components/ui/skeleton";

export default function TicketsLoading() {
  return (
    <div className="space-y-4">
      <Shimmer className="h-3.5 w-24" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl bg-card shadow-e1">
            <div className="flex gap-4 p-4">
              <Shimmer className="size-16 shrink-0" />
              <div className="flex-1 space-y-2">
                <Shimmer className="h-4 w-3/5" />
                <Shimmer className="h-2.5 w-2/5" />
                <Shimmer className="h-2.5 w-1/2" />
              </div>
            </div>
            <div className="perforation h-px w-full" />
            <div className="flex items-center gap-4 p-4">
              <Shimmer className="size-24 shrink-0" />
              <div className="flex-1 space-y-2.5">
                <Shimmer className="h-2.5 w-16" />
                <Shimmer className="h-3 w-24" />
                <Shimmer className="h-2.5 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
