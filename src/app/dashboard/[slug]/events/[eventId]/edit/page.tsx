import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { getEditEventFormOptions, getOrganizerEvent } from "@/features/events/queries";
import { requireOrganizer } from "@/lib/auth";
import { EventForm } from "@/features/events/components/event-form";

export const metadata: Metadata = { title: "Edit event" };

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ slug: string; eventId: string }>;
}) {
  const { slug, eventId } = await params;
  const { organizer } = await requireOrganizer(slug, "staff");
  const [event, { categories, venues }] = await Promise.all([
    getOrganizerEvent(eventId, organizer.id),
    getEditEventFormOptions(organizer.id),
  ]);

  if (!event) notFound();

  return (
    <div className="max-w-3xl space-y-6 px-5 py-8 md:px-8">
      <Link
        href={`/dashboard/${slug}/events/${eventId}`}
        className="inline-flex items-center gap-1.5 text-sm text-ink-3 transition-colors hover:text-ink"
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
