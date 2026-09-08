import type { Metadata } from "next";
import { requireOrganizer } from "@/lib/auth";
import { DashboardEventsShell } from "@/components/dashboard/dashboard-events-table";
import { EventsRows } from "@/components/dashboard/dashboard-events-rows";

export const metadata: Metadata = { title: "Events" };

const PAGE_SIZE = 10;

export default async function DashboardEventsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { slug } = await params;
  const { q, status, page: pageParam } = await searchParams;
  const { organizer } = await requireOrganizer(slug, "staff");
  const page = Math.max(1, Number(pageParam) || 1);

  return (
    <div className="space-y-6">
      <DashboardEventsShell slug={slug}>
        <EventsRows
          organizerId={organizer.id}
          slug={slug}
          query={q}
          status={status}
          page={page}
          pageSize={PAGE_SIZE}
        />
      </DashboardEventsShell>
    </div>
  );
}
