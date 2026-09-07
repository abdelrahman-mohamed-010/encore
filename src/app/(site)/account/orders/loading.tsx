import { Shimmer } from "@/components/ui/skeleton";

export default function OrdersLoading() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Shimmer key={i} className="h-28 rounded-2xl sm:h-24" />
      ))}
    </div>
  );
}
