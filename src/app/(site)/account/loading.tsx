import { StatRowSkeleton } from "@/components/ui/skeleton";

/** Only the part that is waiting on data; the page's own chrome is static. */
export default function SiteAccountLoading() {
  return <div className="space-y-6"><StatRowSkeleton count={3} /></div>;
}
