import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireOrganizer } from "@/lib/auth";
import { DashboardEventsTable } from "@/components/dashboard/dashboard-events-table";

export const metadata: Metadata = { title: "Events" };

export default async function DashboardEventsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organizer } = await requireOrganizer(slug, "staff");
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("events")
    .select(
      `id, title, slug, status, starts_at, cover_image_url, seating_type,
       ticket_types(price_cents, currency, quantity_total, quantity_sold, quantity_reserved)`,
    )
    .eq("organizer_id", organizer.id)
    .order("starts_at", { ascending: false });

  return (
    <div className="space-y-6">
      <DashboardEventsTable
        events={(events ?? []) as unknown as Parameters<typeof DashboardEventsTable>[0]["events"]}
        slug={slug}
      />
    </div>
  );
}
