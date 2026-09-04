import { ListSkeleton, PageHeaderSkeleton } from "@/components/ui/skeleton";

export default function TeamLoading() {
  return (
    <div className="space-y-6 px-5 py-8 md:px-8">
      <PageHeaderSkeleton />
      <ListSkeleton rows={3} />
    </div>
  );
}
