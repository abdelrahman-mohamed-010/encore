import { EventGridSkeleton } from "@/components/ui/skeleton";

/** Only the part that is waiting on data; the page's own chrome is static. */
export default function SiteEventsLoading() {
  return <div className="container-page py-10 md:py-12"><EventGridSkeleton count={9} /></div>;
}
