import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function AttendeesLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <TableSkeleton rows={10} columns={5} />
    </div>
  );
}
