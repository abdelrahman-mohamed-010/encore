import { ListSkeleton, Shimmer, StatRowSkeleton } from "@/components/ui/skeleton";

export default function ManageEventLoading() {
  return (
    <div className="space-y-6">
      <Shimmer className="h-3 w-20" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2.5">
          <Shimmer className="h-7 w-72" />
          <Shimmer className="h-3.5 w-56" />
        </div>
        <div className="flex gap-2">
          <Shimmer className="h-8 w-24" />
          <Shimmer className="h-8 w-32" />
        </div>
      </div>
      <StatRowSkeleton />
      <ListSkeleton rows={3} />
    </div>
  );
}
