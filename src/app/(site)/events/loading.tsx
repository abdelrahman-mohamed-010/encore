import { EventGridSkeleton, PageHeaderSkeleton, Shimmer } from "@/components/ui/skeleton";

export default function EventsLoading() {
  return (
    <div className="container-page py-10 md:py-12">
      <PageHeaderSkeleton withAction={false} />
      <div className="mt-6 flex gap-2 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <Shimmer key={i} className="h-9 w-24 shrink-0 rounded-full" />
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Shimmer key={i} className="h-9 w-36" />
        ))}
      </div>
      <EventGridSkeleton className="mt-8" />
    </div>
  );
}
