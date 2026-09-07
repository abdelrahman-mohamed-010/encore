import { SkeletonGrid } from "@/components/ui/skeleton";

/** Only the part that is waiting on data; the page's own chrome is static. */
export default function DashboardLoading() {
  return <div className="space-y-6"><SkeletonGrid count={3} itemClassName="min-h-40" /></div>;
}
