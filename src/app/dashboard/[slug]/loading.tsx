import { ChartSkeleton, StatRowSkeleton } from "@/components/ui/skeleton";

/** Only the part that is waiting on data; the page's own chrome is static. */
export default function DashboardSlugLoading() {
  return <div className="space-y-6"><><StatRowSkeleton /><ChartSkeleton className="mt-6" /></></div>;
}
