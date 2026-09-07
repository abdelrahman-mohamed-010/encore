import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireOrganizer } from "@/lib/auth";
import { DashboardEventsShell, type DashboardEventItem } from "@/components/dashboard/dashboard-events-table";

export const metadata: Metadata = { title: "Events" };

export default async function DashboardEventsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organizer } = await requireOrganizer(slug, "staff");
  const supabase = await createClient();

  // Not awaited here: the shell (search/filter/"New event") renders instantly,
  // and only the table body suspends on this promise.
  const eventsPromise = supabase
    .from("events")
    .select(
      `id, title, slug, status, starts_at, cover_image_url, seating_type,
       ticket_types(price_cents, currency, quantity_total, quantity_sold, quantity_reserved)`,
    )
    .eq("organizer_id", organizer.id)
    .order("starts_at", { ascending: false })
    .then(({ data }) => (data ?? []) as unknown as DashboardEventItem[]);

  return (
    <div className="space-y-6">
      <DashboardEventsShell eventsPromise={eventsPromise} slug={slug} />
    </div>
  );
}
