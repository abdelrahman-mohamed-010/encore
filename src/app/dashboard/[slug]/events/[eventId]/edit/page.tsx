import { BackLink } from "@/components/ui/back-link";
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
      <BackLink href={`/dashboard/${slug}/events/${eventId}`}>Back to event</BackLink>

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
