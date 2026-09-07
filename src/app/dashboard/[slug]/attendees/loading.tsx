import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function AttendeesLoading() {
  return (
    <div className="space-y-6 px-5 py-8 md:px-8">
      <PageHeaderSkeleton />
      <TableSkeleton rows={10} columns={5} />
    </div>
  );
}
