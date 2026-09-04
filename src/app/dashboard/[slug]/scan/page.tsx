import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireOrganizer } from "@/lib/auth";

import { EmptyState } from "@/components/ui/misc";
import { CalendarDays } from "lucide-react";
import { Scanner } from "@/components/dashboard/scanner";
import { DashboardBody, DashboardHeader } from "@/components/dashboard/page-header";

export const metadata: Metadata = { title: "Check-in" };

/**
 * Events that ended within the last 12 hours are still worth scanning for (late
 * arrivals, re-entry). Reading the clock is correct here — this is an async
 * Server Component that runs once per request, not a re-rendering client tree.
 */
function scanWindowStart() {
  return new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
}

export default async function ScanPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { organizer } = await requireOrganizer(slug, "scanner");
  const supabase = await createClient();

  // Anything running now or soon is worth scanning for.
  const { data: events } = await supabase
    .from("events")
    .select("id, title, starts_at")
    .eq("organizer_id", organizer.id)
    .eq("status", "published")
    .gte("ends_at", scanWindowStart())
    .order("starts_at", { ascending: true });

  return (
    <>
      <DashboardHeader
        title="Check-in"
        description="Scan a ticket QR code, or type the code if the camera is unavailable."
      />

      <DashboardBody className="space-y-6">

      {!events || events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No events to check in"
          description="Published events that have not finished yet appear here."
        />
      ) : (
        <Scanner events={events} />
      )}
      </DashboardBody>
    </>
);
}
