import { SkeletonRows } from "@/components/ui/skeleton";

/** Only the part that is waiting on data; the page's own chrome is static. */
export default function SiteAccountTicketsLoading() {
  return <div className="space-y-6"><SkeletonRows rows={5} height="h-28" className="rounded-xl" /></div>;
}
