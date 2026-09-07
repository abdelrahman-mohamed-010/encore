import { Shimmer } from "@/components/ui/skeleton";

export default function VenueLoading() {
  return (
    <div className="container-page py-10">
      <Shimmer className="h-3.5 w-40" />
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Shimmer className="h-8 w-64" />
          <Shimmer className="h-4 w-48" />
        </div>
        <Shimmer className="h-10 w-36 rounded-xl" />
      </div>
      <Shimmer className="mt-8 h-72 rounded-xl" />
      <Shimmer className="mt-12 h-6 w-40" />
      <Shimmer className="mt-5 h-64 rounded-xl" />
    </div>
  );
}
