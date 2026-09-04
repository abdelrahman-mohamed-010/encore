import { ListSkeleton, PageHeaderSkeleton } from "@/components/ui/skeleton";

export default function AdminCategoriesLoading() {
  return (
    <div className="max-w-2xl space-y-6">
      <PageHeaderSkeleton withAction={false} />
      <ListSkeleton rows={8} />
    </div>
  );
}
