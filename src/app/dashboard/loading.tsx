import { ListSkeleton, PageHeaderSkeleton } from "@/components/ui/skeleton";

export default function DashboardIndexLoading() {
  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl space-y-8">
        <PageHeaderSkeleton withAction={false} />
        <ListSkeleton rows={3} />
      </div>
    </div>
  );
}
