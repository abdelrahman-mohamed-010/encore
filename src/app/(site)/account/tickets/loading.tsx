import { Shimmer } from "@/components/ui/skeleton";

export default function TicketsLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Shimmer key={i} className="h-44 rounded-2xl" />
      ))}
    </div>
  );
}
