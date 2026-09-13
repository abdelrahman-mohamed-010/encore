import { Shimmer } from "@/components/ui/skeleton";

export default function OrganizerLoading() {
  return (
    <>
      <Shimmer className="h-44 rounded-none md:h-64" />
      <div className="container-page pb-16">
        <div className="relative -mt-12 flex items-end gap-5 pb-6 border-b border-hairline md:-mt-16">
          <Shimmer className="size-24 rounded-2xl border-4 border-paper md:size-28" />
          <Shimmer className="mb-1 h-9 w-64" />
        </div>
        <Shimmer className="mt-6 h-16 max-w-3xl" />

        <div className="mt-12 space-y-4">
          <Shimmer className="h-8 w-48" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Shimmer key={i} className="h-32 rounded-2xl sm:h-28" />
          ))}
        </div>
      </div>
    </>
  );
}
