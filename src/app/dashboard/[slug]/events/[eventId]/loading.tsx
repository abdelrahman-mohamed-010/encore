import { Shimmer } from "@/components/ui/skeleton";

export default function ManageEventLoading() {
  return (
    <div className="space-y-6 px-5 md:px-8">
      <Shimmer className="h-3 w-20" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2.5">
          <Shimmer className="h-7 w-72" />
          <Shimmer className="h-3.5 w-56" />
        </div>
        <div className="flex gap-2">
          <Shimmer className="h-8 w-24" />
          <Shimmer className="h-8 w-32" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Shimmer key={i} className="h-24 rounded-xl" />)}
      </div>
      <Shimmer className="h-64 rounded-xl" />
    </div>
  );
}
