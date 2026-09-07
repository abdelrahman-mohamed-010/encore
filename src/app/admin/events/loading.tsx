import { SkeletonRows } from "@/components/ui/skeleton";

/** Only the part that is waiting on data; the page's own chrome is static. */
export default function AdminEventsLoading() {
  return <div className="space-y-6"><SkeletonRows rows={8} height="h-16" className="rounded-xl" /></div>;
}
