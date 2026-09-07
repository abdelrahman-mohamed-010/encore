import { SkeletonRows } from "@/components/ui/skeleton";

/** Only the part that is waiting on data; the page's own chrome is static. */
export default function DashboardSlugOrdersLoading() {
  return <div className="space-y-6"><SkeletonRows rows={10} height="h-14" className="rounded-xl" /></div>;
}
