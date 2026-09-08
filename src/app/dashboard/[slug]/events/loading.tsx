"use client";

import { useParams } from "next/navigation";
import { DashboardEventsShell } from "@/components/dashboard/dashboard-events-table";
import { TableRowsSkeleton } from "@/components/ui/table";

/**
 * Exists purely so this dynamic route gets prefetched — a dynamic route with
 * no loading.tsx isn't prefetched at all, which is why tab navigation felt
 * slow. Renders the real shell (so the search box/filter/button never
 * flash-swap) with skeleton rows as the fallback's only fake part.
 */
export default function Loading() {
  const { slug } = useParams<{ slug: string }>();
  return (
    <div className="space-y-6">
      <DashboardEventsShell slug={slug}>
        <TableRowsSkeleton rows={6} columns={7} />
      </DashboardEventsShell>
    </div>
  );
}
