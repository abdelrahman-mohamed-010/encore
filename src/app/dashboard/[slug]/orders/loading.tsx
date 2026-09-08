"use client";

import { DashboardOrdersShell } from "@/components/dashboard/dashboard-orders-table";
import { TableRowsSkeleton } from "@/components/ui/table";

/** See events/loading.tsx — exists to make this dynamic route prefetchable. */
export default function Loading() {
  return (
    <div className="space-y-6">
      <DashboardOrdersShell canRefund>
        <TableRowsSkeleton rows={6} columns={7} />
      </DashboardOrdersShell>
    </div>
  );
}
