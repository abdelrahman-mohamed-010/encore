import { PageHeaderSkeleton, Shimmer } from "@/components/ui/skeleton";

export default function PaymentsLoading() {
  return (
    <div className="max-w-2xl space-y-6 px-5 py-8 md:px-8">
      <PageHeaderSkeleton withAction={false} />
      <div className="overflow-hidden rounded-xl bg-card">
        <div className="flex items-center justify-between border-b border-hairline-soft px-5 py-4">
          <Shimmer className="h-3.5 w-20" />
          <Shimmer className="h-6 w-24 rounded-lg" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border-b border-hairline-soft px-4 py-3.5 last:border-b-0">
            <Shimmer className="h-2.5 w-24" />
            <Shimmer className="mt-1.5 h-3.5 w-40" />
          </div>
        ))}
      </div>
    </div>
  );
}
