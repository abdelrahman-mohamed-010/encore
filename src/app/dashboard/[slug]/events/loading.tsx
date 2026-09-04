import { ListSkeleton, PageHeaderSkeleton } from "@/components/ui/skeleton";

export default function DashboardEventsLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <ListSkeleton rows={6} />
    </div>
  );
}
