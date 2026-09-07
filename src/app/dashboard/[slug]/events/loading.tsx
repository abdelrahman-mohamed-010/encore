import { SkeletonRows } from "@/components/ui/skeleton";

/** Only the part that is waiting on data; the page's own chrome is static. */
export default function DashboardSlugEventsLoading() {
  return <div className="space-y-6"><SkeletonRows rows={6} height="h-24" className="rounded-xl" /></div>;
}
