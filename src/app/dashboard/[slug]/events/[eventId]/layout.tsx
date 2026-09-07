import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireOrganizer } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TabNav } from "@/components/ui/tab-nav";
import { DashboardHeader } from "@/components/dashboard/page-header";
import { EventStatusControl } from "@/components/dashboard/event-status-control";
import type { EventStatus } from "@/lib/types";

const STATUS_TONE: Record<EventStatus, "positive" | "caution" | "neutral" | "critical"> = {
  published: "positive",
  draft: "neutral",
  pending_review: "caution",
  paused: "caution",
  cancelled: "critical",
  completed: "neutral",
};

/**
 * Managing an event is its own place, with the event's own tabs.
 *
 * The dashboard's sidebar is organization-level — money, people, settings.
 * Everything that belongs to one event lives here instead, so the organizer
 * works inside the thing they are running rather than hopping between
 * resource lists and re-filtering each one down to the same event.
 */
export default async function ManageEventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string; eventId: string }>;
}) {
  const { slug, eventId } = await params;
  const { organizer, role } = await requireOrganizer(slug, "scanner");
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, title, slug, status")
    .eq("id", eventId)
    .eq("organizer_id", organizer.id)
    .maybeSingle();

  if (!event) notFound();

  const canEdit = role === "owner" || role === "admin" || role === "staff";
  const base = `/dashboard/${slug}/events/${eventId}`;

  const tabs = [
    { href: base, label: "Overview" },
    { href: `${base}/guests`, label: "Guests" },
    { href: `${base}/registration`, label: "Registration" },
    { href: `${base}/insights`, label: "Insights" },
    { href: `${base}/settings`, label: "More" },
  ];

  return (
    <>
      <DashboardHeader
        crumb={{ label: "Events", href: `/dashboard/${slug}/events` }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-flourish">{event.title}</span>
            <Badge tone={STATUS_TONE[event.status]} size="md">
              {event.status.replace("_", " ")}
            </Badge>
          </span>
        }
        actions={
          <>
            {event.status === "published" && (
              <Button asChild variant="soft" size="md">
                <Link href={`/events/${event.slug}`} target="_blank">
                  Event page <ExternalLink />
                </Link>
              </Button>
            )}
            {canEdit && <EventStatusControl eventId={eventId} status={event.status} />}
          </>
        }
        tabs={<TabNav items={tabs} />}
      />
      {children}
    </>
  );
}
