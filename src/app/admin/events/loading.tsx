import { ListSkeleton, PageHeaderSkeleton, Shimmer } from "@/components/ui/skeleton";

export default function AdminEventsLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton withAction={false} />
      <Shimmer className="h-9 w-72 rounded-lg" />
      <ListSkeleton rows={6} />
    </div>
  );
}
