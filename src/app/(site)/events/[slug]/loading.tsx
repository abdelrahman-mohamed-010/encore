import { Shimmer } from "@/components/ui/skeleton";

export default function EventDetailLoading() {
  return (
    <div className="container-narrow py-8 md:py-14">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-14">
        <div>
          <Shimmer className="aspect-square rounded-2xl" />
          <Shimmer className="mt-5 h-14 rounded-lg" />
        </div>

        <div className="min-w-0">
          <Shimmer className="h-6 w-24 rounded-full" />
          <Shimmer className="mt-4 h-10 w-4/5" />
          <Shimmer className="mt-3 h-5 w-3/5" />
          <Shimmer className="mt-8 h-56 rounded-2xl" />
          <Shimmer className="mt-8 h-32 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
