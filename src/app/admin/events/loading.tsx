import { EventReviewShell } from "@/components/admin/event-review-list";
import { TableRowsSkeleton } from "@/components/ui/table";

/** See dashboard/[slug]/events/loading.tsx — exists to make this dynamic route prefetchable. */
export default function Loading() {
  return (
    <EventReviewShell>
      <TableRowsSkeleton rows={6} columns={5} />
    </EventReviewShell>
  );
}
