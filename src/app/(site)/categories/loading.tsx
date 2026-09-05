import { PageHeaderSkeleton, Shimmer } from "@/components/ui/skeleton";

export default function CategoriesLoading() {
  return (
    <div className="container-page py-10 md:py-12">
      <PageHeaderSkeleton withAction={false} />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-card p-5">
            <Shimmer className="size-10" />
            <Shimmer className="mt-3.5 h-4 w-24" />
            <Shimmer className="mt-2 h-2.5 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
