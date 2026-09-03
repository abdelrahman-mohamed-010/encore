import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireOrganizer } from "@/lib/auth";
import { EventForm } from "@/components/dashboard/event-form";

export const metadata: Metadata = { title: "New event" };

export default async function NewEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { organizer } = await requireOrganizer(slug, "staff");
  const supabase = await createClient();

  const [{ data: categories }, { data: venues }] = await Promise.all([
    supabase.from("categories").select("id, name").eq("is_active", true).order("sort_order"),
    supabase
      .from("venues")
      .select("id, name, city, seating_type")
      .or(`organizer_id.eq.${organizer.id},organizer_id.is.null`)
      .eq("is_active", true)
      .order("name"),
  ]);

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href={`/dashboard/${slug}/events`}
        className="inline-flex items-center gap-1.5 text-[13px] text-ink-3 transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" />
        Events
      </Link>

      <div>
        <h1 className="display-3 text-ink">Create an event</h1>
        <p className="mt-2 text-[14px] text-ink-2">
          Start with the essentials. You can add ticket types and artwork next.
        </p>
      </div>

      <EventForm
        organizerId={organizer.id}
        organizerSlug={slug}
        categories={categories ?? []}
        venues={venues ?? []}
      />
    </div>
  );
}
