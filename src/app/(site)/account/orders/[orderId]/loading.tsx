import { Shimmer } from "@/components/ui/skeleton";

export default function OrderDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Shimmer className="h-3 w-24" />
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Shimmer className="h-7 w-64" />
          <Shimmer className="h-3 w-32" />
        </div>
        <Shimmer className="h-6 w-16 rounded-lg" />
      </div>
      {Array.from({ length: 3 }).map((_, card) => (
        <div key={card} className="overflow-hidden rounded-xl bg-card">
          <div className="border-b border-hairline-soft px-4 py-3.5">
            <Shimmer className="h-3.5 w-24" />
          </div>
          <div className="space-y-3 p-4">
            {Array.from({ length: 3 }).map((_, row) => (
              <div key={row} className="flex justify-between gap-4">
                <Shimmer className="h-3.5 w-2/5" />
                <Shimmer className="h-3.5 w-16" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
