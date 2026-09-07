import { EventCardSkeleton, Shimmer } from "@/components/ui/skeleton";

export default function AccountLoading() {
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
      <Shimmer className="hidden" />
    </div>
  );
}
