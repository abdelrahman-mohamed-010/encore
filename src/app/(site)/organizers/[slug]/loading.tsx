import { EventGridSkeleton, Shimmer, SkeletonText } from "@/components/ui/skeleton";

export default function OrganizerLoading() {
  return (
    <>
      <Shimmer className="h-40 rounded-none md:h-56" />
      <div className="container-page">
        <div className="-mt-10 flex items-end gap-4 md:-mt-12">
          <Shimmer className="size-20 rounded-full border-4 border-paper md:size-24" />
          <Shimmer className="mb-2 h-8 w-56" />
        </div>
        <SkeletonText lines={2} className="mt-5 max-w-2xl" />
        <Shimmer className="mt-12 h-7 w-48" />
        <EventGridSkeleton className="mt-6" />
      </div>
    </>
  );
}
