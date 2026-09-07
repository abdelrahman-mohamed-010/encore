import { ChartSkeleton, StatRowSkeleton } from "@/components/ui/skeleton";

/** Only the part that is waiting on data; the page's own chrome is static. */
export default function DashboardSlugEventsEventidLoading() {
  return <div className="space-y-6 px-5 py-8 md:px-8"><><StatRowSkeleton /><ChartSkeleton className="mt-6" /></></div>;
}
