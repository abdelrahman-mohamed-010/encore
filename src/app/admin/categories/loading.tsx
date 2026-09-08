import { SectionHeader } from "@/components/ui/surface";
import { Shimmer } from "@/components/ui/skeleton";

/** See dashboard/[slug]/events/loading.tsx — exists to make this dynamic route prefetchable. */
export default function Loading() {
  return (
    <div className="max-w-2xl space-y-6">
      <SectionHeader
        level={1}
        title="Categories"
        description="The taxonomy every organizer picks from when creating an event."
      />
      <div className="overflow-hidden rounded-xl bg-card">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border-b border-hairline-soft px-4 py-3 last:border-b-0">
            <Shimmer className="h-9 rounded-lg" />
          </div>
        ))}
      </div>
      <Shimmer className="h-32 rounded-xl" />
    </div>
  );
}
