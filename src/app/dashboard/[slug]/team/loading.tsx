import { ListSkeleton, PageHeaderSkeleton } from "@/components/ui/skeleton";

export default function TeamLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <ListSkeleton rows={3} />
    </div>
  );
}
