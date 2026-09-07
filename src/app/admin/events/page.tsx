import { Suspense } from "react";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SectionHeader } from "@/components/ui/surface";
import { SkeletonRows } from "@/components/ui/skeleton";
import { EventReviewList } from "@/components/admin/event-review-list";

export const metadata: Metadata = { title: "Event review" };

export default async function AdminEventsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        level={1}
        title="Event review"
        description="Approve events before they go on sale, or pull one down."
      />
      <Suspense fallback={<SkeletonRows rows={6} height="h-24" />}>
        <Review />
      </Suspense>
    </div>
  );
}

async function Review() {
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("events")
    .select(
      `id, title, slug, status, starts_at, cover_image_url, subtitle, created_at,
       organizer:organizers(id, name, slug),
       venue:venues(name, city),
       ticket_types(price_cents, quantity_total)`,
    )
    .in("status", ["pending_review", "published", "draft", "paused"])
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <EventReviewList
      events={(events ?? []).map((event) => ({
        id: event.id,
        title: event.title,
        slug: event.slug,
        status: event.status,
        subtitle: event.subtitle,
        startsAt: event.starts_at,
        coverImageUrl: event.cover_image_url,
        organizerName: event.organizer?.name ?? "",
        venueLabel: [event.venue?.name, event.venue?.city].filter(Boolean).join(" · "),
        tiers: (event.ticket_types ?? []).length,
        capacity: (event.ticket_types ?? []).reduce((sum, t) => sum + t.quantity_total, 0),
      }))}
    />
  );
}
