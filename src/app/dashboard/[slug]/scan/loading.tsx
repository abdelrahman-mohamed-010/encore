import { PageHeaderSkeleton, Shimmer } from "@/components/ui/skeleton";

export default function ScanLoading() {
  return (
    <div className="space-y-6 px-5 py-8 md:px-8">
      <PageHeaderSkeleton withAction={false} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <div className="rounded-xl bg-card shadow-e1">
            <div className="border-b border-hairline-soft px-5 py-4">
              <Shimmer className="h-3.5 w-20" />
            </div>
            <div className="space-y-4 p-5">
              <Shimmer className="h-10 w-full" />
              <Shimmer className="aspect-video w-full rounded-xl" />
              <Shimmer className="h-11 w-full" />
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-card shadow-e1">
          <div className="border-b border-hairline-soft px-5 py-4">
            <Shimmer className="h-3.5 w-24" />
          </div>
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Shimmer key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
