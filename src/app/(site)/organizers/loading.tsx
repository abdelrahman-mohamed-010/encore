import { PageHeaderSkeleton, Shimmer } from "@/components/ui/skeleton";

export default function OrganizersLoading() {
  return (
    <div className="container-page py-10 md:py-12">
      <PageHeaderSkeleton withAction={false} />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-hairline bg-card p-5">
            <Shimmer className="size-11 rounded-full" />
            <Shimmer className="mt-3 h-4 w-2/5" />
            <Shimmer className="mt-2 h-2.5 w-20" />
            <Shimmer className="mt-2.5 h-3 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
