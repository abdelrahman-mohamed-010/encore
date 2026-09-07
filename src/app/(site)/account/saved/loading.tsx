import { EventGridSkeleton } from "@/components/ui/skeleton";

/** Only the part that is waiting on data; the page's own chrome is static. */
export default function SiteAccountSavedLoading() {
  return <div className="space-y-6"><EventGridSkeleton count={6} /></div>;
}
