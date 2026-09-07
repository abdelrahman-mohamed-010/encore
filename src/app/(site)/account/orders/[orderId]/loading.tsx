import { Shimmer } from "@/components/ui/skeleton";

export default function OrderDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Shimmer className="h-3 w-24" />
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Shimmer className="h-7 w-64" />
          <Shimmer className="h-3 w-32" />
        </div>
        <Shimmer className="h-6 w-16 rounded-lg" />
      </div>
      <Shimmer className="h-40 rounded-xl" />
      <Shimmer className="h-32 rounded-xl" />
      <Shimmer className="h-24 rounded-xl" />
    </div>
  );
}
