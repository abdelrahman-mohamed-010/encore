import { ChartSkeleton, ListSkeleton, PageHeaderSkeleton, StatRowSkeleton } from "@/components/ui/skeleton";

export default function DashboardOverviewLoading() {
  return (
    <div className="space-y-8 px-5 py-8 md:px-8">
      <PageHeaderSkeleton />
      <StatRowSkeleton />
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartSkeleton title />
        <ChartSkeleton title />
      </div>
      <ListSkeleton rows={4} />
    </div>
  );
}
