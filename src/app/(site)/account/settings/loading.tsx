import { Shimmer } from "@/components/ui/skeleton";

/** See dashboard/[slug]/events/loading.tsx — exists to make this dynamic route prefetchable. */
export default function Loading() {
  return (
    <div className="max-w-2xl space-y-5">
      <Shimmer className="size-20 rounded-full" />
      <Shimmer className="h-56 rounded-xl" />
      <div className="flex justify-end">
        <Shimmer className="h-10 w-28 rounded-md" />
      </div>
    </div>
  );
}
