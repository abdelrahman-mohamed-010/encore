import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { CalendarDays, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireOrganizer } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";


import { EmptyState, Meter } from "@/components/ui/misc";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import type { EventStatus } from "@/lib/types";
import { DashboardBody, DashboardHeader } from "@/components/dashboard/page-header";

export const metadata: Metadata = { title: "Events" };

const STATUS_TONE: Record<EventStatus, "positive" | "caution" | "neutral" | "critical"> = {
  published: "positive",
  draft: "neutral",
  pending_review: "caution",
  paused: "caution",
  cancelled: "critical",
  completed: "neutral",
};

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
    <>
      <DashboardHeader
        title="Events"
        description="Everything you have created, on sale or not."
        actions={
          <Button asChild variant="solid" size="md">
            <Link href={`/dashboard/${slug}/events/new`}><Plus /> New event</Link>
          </Button>
        }
      />

      <DashboardBody className="space-y-6">
      {!events || events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No events yet"
          description="Create your first event, add ticket types, then submit it for review."
          action={
            <Button asChild variant="solid" size="md">
              <Link href={`/dashboard/${slug}/events/new`}><Plus /> New event</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2">
          {events.map((event) => {
            const tiers = event.ticket_types ?? [];
            const capacity = tiers.reduce((sum, t) => sum + t.quantity_total, 0);
            const sold = tiers.reduce((sum, t) => sum + t.quantity_sold, 0);
            const gross = tiers.reduce((sum, t) => sum + t.quantity_sold * t.price_cents, 0);
            const currency = tiers[0]?.currency ?? "USD";

            return (
              <li key={event.id}>
              <Link
                href={`/dashboard/${slug}/events/${event.id}`}
                className="flex items-center gap-4 rounded-xl bg-card px-5 py-4 shadow-e1 transition-shadow hover:shadow-e2"
              >
                <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-sunken">
                  {event.cover_image_url && (
                    <Image src={event.cover_image_url} alt="" fill sizes="48px" className="object-cover" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-flourish text-lg text-ink">{event.title}</p>
                    <Badge tone={STATUS_TONE[event.status]} size="xs">
                      {event.status.replace("_", " ")}
                    </Badge>
                    {event.seating_type === "reserved_seating" && (
                      <Badge tone="outline" size="xs">Reserved seating</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-ink-3">
                    {formatDate(event.starts_at, "medium")}
                  </p>
                </div>

                <div className="hidden w-40 shrink-0 sm:block">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-ink-3">Sold</span>
                    <span className="tabular text-ink">
                      {formatNumber(sold)}/{formatNumber(capacity)}
                    </span>
                  </div>
                  <Meter value={sold} max={capacity || 1} className="mt-1.5" />
                </div>

                <span className="hidden w-24 shrink-0 text-right text-base font-semibold tabular text-ink md:block">
                  {formatMoney(gross, currency)}
                </span>
              </Link>
              </li>
            );
          })}
        </ul>
      )}
      </DashboardBody>
    </>
);
}
