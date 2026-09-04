import { ListSkeleton, PageHeaderSkeleton } from "@/components/ui/skeleton";

export default function PromosLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <ListSkeleton rows={4} />
    </div>
  );
}
