import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireOrganizer } from "@/lib/auth";
import { DashboardAttendeesShell, type DashboardAttendeeItem } from "@/components/dashboard/dashboard-attendees-table";

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
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("events")
    .select("id, title")
    .eq("organizer_id", organizer.id)
    .order("starts_at", { ascending: false });

  const eventIds = (events ?? []).map((e) => e.id);
  const scoped = eventFilter && eventIds.includes(eventFilter) ? [eventFilter] : eventIds;

  const ticketsPromise = eventIds.length
    ? supabase
        .from("tickets")
        .select(
          `id, ticket_code, attendee_name, attendee_email, seat_label, status, checked_in_at,
           ticket_type:ticket_types(name),
           event:events(title)`,
        )
        .in("event_id", scoped)
        .order("issued_at", { ascending: false })
        .limit(500)
        .then(({ data }) => (data ?? []) as unknown as DashboardAttendeeItem[])
    : Promise.resolve([]);

  return (
    <div className="space-y-4">
      <DashboardAttendeesShell
        ticketsPromise={ticketsPromise}
        events={events ?? []}
        initialEventFilter={eventFilter}
        slug={slug}
      />
    </div>
  );
}
