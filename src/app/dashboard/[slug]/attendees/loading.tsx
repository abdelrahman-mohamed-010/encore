"use client";

import { DashboardAttendeesShell } from "@/components/dashboard/dashboard-attendees-table";
import { TableRowsSkeleton } from "@/components/ui/table";

/** See events/loading.tsx — exists to make this dynamic route prefetchable. */
export default function Loading() {
  return (
    <div className="space-y-4">
      <DashboardAttendeesShell events={[]}>
        <TableRowsSkeleton rows={8} columns={5} />
      </DashboardAttendeesShell>
    </div>
  );
}
