import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function DashboardOrdersLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton withAction={false} />
      <TableSkeleton rows={10} columns={6} />
    </div>
  );
}
