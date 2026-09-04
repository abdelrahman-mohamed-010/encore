import { EventGridSkeleton, PageHeaderSkeleton, Shimmer } from "@/components/ui/skeleton";

export default function SiteLoading() {
  return (
    <div className="container-page py-10 md:py-12">
      <PageHeaderSkeleton withAction={false} />
      <div className="mt-6 flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Shimmer key={i} className="h-9 w-24 rounded-lg" />
        ))}
      </div>
      <EventGridSkeleton className="mt-8" />
    </div>
  );
}
