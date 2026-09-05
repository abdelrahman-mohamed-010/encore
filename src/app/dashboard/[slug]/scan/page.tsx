import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireOrganizer } from "@/lib/auth";
import { EmptyState } from "@/components/ui/misc";
import { CalendarDays } from "lucide-react";
import { Scanner } from "@/components/dashboard/scanner";

export const metadata: Metadata = { title: "Check-in" };

function scanWindowStart() {
  return new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
}

export default async function ScanPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { organizer } = await requireOrganizer(slug, "scanner");
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("events")
    .select("id, title, starts_at")
    .eq("organizer_id", organizer.id)
    .eq("status", "published")
    .gte("ends_at", scanWindowStart())
    .order("starts_at", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-ink">Check-in Scanner</h2>
        <p className="mt-1 text-sm text-ink-3">
          Scan a ticket QR code, or type the code if the camera is unavailable.
        </p>
      </div>

      {!events || events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No events to check in"
          description="Published events that have not finished yet appear here."
        />
      ) : (
        <Scanner events={events} />
      )}
    </div>
  );
}
