import type { Metadata } from "next";
import { SectionHeader } from "@/components/ui/surface";
import { EventReviewShell } from "@/features/admin/components/event-review-list";
import { EventReviewRows } from "@/features/admin/components/event-review-rows";

export const metadata: Metadata = { title: "Event review" };

const PAGE_SIZE = 10;

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { q, status, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  return (
    <div className="space-y-6">
      <SectionHeader
        level={1}
        title="Event review"
        description="Approve events before they go on sale, or pull one down."
      />
      <EventReviewShell>
        <EventReviewRows query={q} status={status} page={page} pageSize={PAGE_SIZE} />
      </EventReviewShell>
    </div>
  );
}
