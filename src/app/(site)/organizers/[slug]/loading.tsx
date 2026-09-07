import { EventGridSkeleton } from "@/components/ui/skeleton";

/** Only the part that is waiting on data; the page's own chrome is static. */
export default function SiteOrganizersSlugLoading() {
  return <div className="container-page py-10"><EventGridSkeleton count={6} /></div>;
}
