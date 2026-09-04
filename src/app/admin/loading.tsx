import { ListSkeleton, PageHeaderSkeleton, StatRowSkeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton withAction={false} />
      <StatRowSkeleton />
      <ListSkeleton rows={5} />
    </div>
  );
}
