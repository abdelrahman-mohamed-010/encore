import { SkeletonRows } from "@/components/ui/skeleton";

/** Only the part that is waiting on data; the page's own chrome is static. */
export default function SiteAccountOrdersLoading() {
  return <div className="space-y-6"><SkeletonRows rows={6} height="h-20" className="rounded-xl" /></div>;
}
