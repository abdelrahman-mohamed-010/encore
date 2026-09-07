import { Suspense } from "react";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireOrganizer } from "@/lib/auth";
import { SkeletonRows } from "@/components/ui/skeleton";
import { DashboardAttendeesTable } from "@/components/dashboard/dashboard-attendees-table";

export const metadata: Metadata = { title: "Attendees" };

export default async function AttendeesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ event?: string }>;
}) {
  const { slug } = await params;
  const { event: eventFilter } = await searchParams;
  const { organizer } = await requireOrganizer(slug, "scanner");

  return (
    <div className="space-y-4">
      {/* Keyed on the filter so changing it shows the placeholder again rather
          than holding the previous event's rows on screen. */}
      <Suspense key={eventFilter ?? "all"} fallback={<SkeletonRows rows={10} />}>
        <Attendees organizerId={organizer.id} eventFilter={eventFilter} slug={slug} />
      </Suspense>
    </div>
  );
}

async function Attendees({
  organizerId,
  eventFilter,
  slug,
}: {
  organizerId: string;
  eventFilter?: string;
  slug: string;
}) {
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("events")
    .select("id, title")
    .eq("organizer_id", organizerId)
    .order("starts_at", { ascending: false });

  const eventIds = (events ?? []).map((e) => e.id);
  const scoped = eventFilter && eventIds.includes(eventFilter) ? [eventFilter] : eventIds;

  const { data: tickets } = eventIds.length
    ? await supabase
        .from("tickets")
        .select(
          `id, ticket_code, attendee_name, attendee_email, seat_label, status, checked_in_at,
           ticket_type:ticket_types(name),
           event:events(title)`,
        )
        .in("event_id", scoped)
        .order("issued_at", { ascending: false })
        .limit(500)
    : { data: [] };

  return (
    <DashboardAttendeesTable
      tickets={(tickets ?? []) as unknown as Parameters<typeof DashboardAttendeesTable>[0]["tickets"]}
      events={events ?? []}
      initialEventFilter={eventFilter}
      slug={slug}
    />
  );
}
