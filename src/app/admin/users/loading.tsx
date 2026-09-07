import { PageHeaderSkeleton, Shimmer, TableSkeleton } from "@/components/ui/skeleton";

export default function AdminUsersLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton withAction={false} />
      <Shimmer className="h-10 w-full max-w-sm" />
      <TableSkeleton rows={10} columns={5} />
    </div>
  );
}
