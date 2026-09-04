import { ListSkeleton, PageHeaderSkeleton } from "@/components/ui/skeleton";

export default function PromosLoading() {
  return (
    <div className="space-y-6 px-5 py-8 md:px-8">
      <PageHeaderSkeleton />
      <ListSkeleton rows={4} />
    </div>
  );
}
