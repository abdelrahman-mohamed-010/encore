import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireOrganizer } from "@/lib/auth";
import { DashboardAttendeesShell } from "@/components/dashboard/dashboard-attendees-table";
import { AttendeeRows } from "@/components/dashboard/dashboard-attendees-rows";

export const metadata: Metadata = { title: "Attendees" };

const PAGE_SIZE = 15;

export default async function AttendeesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ event?: string; q?: string; status?: string; page?: string }>;
}) {
  const { slug } = await params;
  const { event: eventFilter, q, status, page: pageParam } = await searchParams;
  const { organizer } = await requireOrganizer(slug, "scanner");
  const supabase = await createClient();
  const page = Math.max(1, Number(pageParam) || 1);

  const { data: events } = await supabase
    .from("events")
    .select("id, title")
    .eq("organizer_id", organizer.id)
    .order("starts_at", { ascending: false });

  const eventIds = (events ?? []).map((e) => e.id);

  return (
    <div className="space-y-4">
      <DashboardAttendeesShell events={events ?? []}>
        <AttendeeRows
          eventIds={eventIds}
          eventFilter={eventFilter}
          query={q}
          statusFilter={status}
          page={page}
          pageSize={PAGE_SIZE}
        />
      </DashboardAttendeesShell>
    </div>
  );
}
