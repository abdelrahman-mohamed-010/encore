import { Shimmer } from "@/components/ui/skeleton";

export default function HostProfileLoading() {
  return (
    <div className="container-narrow py-12">
      <div className="flex flex-col items-center gap-5">
        <Shimmer className="size-28 rounded-full" />
        <div className="flex flex-col items-center gap-2">
          <Shimmer className="h-8 w-48" />
          <Shimmer className="h-3.5 w-40" />
        </div>
      </div>

      <div className="mt-12">
        <Shimmer className="h-6 w-24" />
        <Shimmer className="mt-4 h-56 rounded-xl" />
      </div>
    </div>
  );
}
