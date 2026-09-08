"use client";

import { TeamShell } from "@/components/dashboard/team-manager";
import { TableRowsSkeleton } from "@/components/ui/table";

/** See events/loading.tsx — exists to make this dynamic route prefetchable. */
export default function Loading() {
  return (
    <TeamShell organizerId="" viewerRole="scanner">
      <TableRowsSkeleton rows={5} columns={4} />
    </TeamShell>
  );
}
