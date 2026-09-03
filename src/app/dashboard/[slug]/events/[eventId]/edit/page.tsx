import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireOrganizer } from "@/lib/auth";
import { EventForm } from "@/components/dashboard/event-form";

export const metadata: Metadata = { title: "Edit event" };

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ slug: string; eventId: string }>;
}) {
  const { slug, eventId } = await params;
  const { organizer } = await requireOrganizer(slug, "staff");
  const supabase = await createClient();

  const [{ data: event }, { data: categories }, { data: venues }] = await Promise.all([
    supabase.from("events").select("*").eq("id", eventId).eq("organizer_id", organizer.id).maybeSingle(),
    supabase.from("categories").select("id, name").eq("is_active", true).order("sort_order"),
    supabase
      .from("venues")
      .select("id, name, city")
      .or(`organizer_id.eq.${organizer.id},organizer_id.is.null`)
      .eq("is_active", true)
      .order("name"),
  ]);

  if (!event) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href={`/dashboard/${slug}/events/${eventId}`}
        className="inline-flex items-center gap-1.5 text-[13px] text-ink-3 transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" />
        Back to event
      </Link>

      <h1 className="display-3 text-ink">Edit event</h1>

      <EventForm
        organizerId={organizer.id}
        organizerSlug={slug}
        categories={categories ?? []}
        venues={venues ?? []}
        event={event}
      />
    </div>
  );
}
