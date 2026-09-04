import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Globe, Mail, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, EmptyState } from "@/components/ui/misc";
import { EventCard } from "@/components/events/event-card";
import { Badge } from "@/components/ui/badge";
import type { EventSearchResult } from "@/lib/types";

export const revalidate = 120;

async function loadOrganizer(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organizers")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const organizer = await loadOrganizer(slug);
  if (!organizer) return { title: "Organizer not found" };
  return {
    title: organizer.name,
    description: organizer.description ?? `Events by ${organizer.name} on Tazkarti.`,
  };
}

export default async function OrganizerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const organizer = await loadOrganizer(slug);
  if (!organizer) notFound();

  const supabase = await createClient();
  const { data: events } = await supabase.rpc("search_events", {
    p_organizer_slug: slug,
    p_limit: 50,
  });

  const rows = (events ?? []) as EventSearchResult[];

  return (
    <>
      <div className="relative h-40 bg-sunken md:h-56">
        {organizer.banner_url && (
          <Image src={organizer.banner_url} alt="" fill sizes="100vw" className="object-cover" priority />
        )}
      </div>

      <div className="container-page">
        <div className="-mt-10 flex flex-wrap items-end gap-4 md:-mt-12">
          <Avatar
            src={organizer.logo_url}
            name={organizer.name}
            size="xl"
            className="size-20 border-4 border-paper md:size-24"
          />
          <div className="min-w-0 flex-1 pb-1">
            <h1 className="display-3 flex flex-wrap items-center gap-2 text-ink">
              {organizer.name}
              {organizer.verification_status === "verified" && (
                <Badge tone="info" size="sm">
                  <ShieldCheck className="size-3" /> Verified
                </Badge>
              )}
            </h1>
          </div>
        </div>

        {organizer.description && (
          <p className="mt-5 max-w-2xl text-md leading-relaxed text-ink-2">
            {organizer.description}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-5 text-sm text-ink-3">
          {organizer.website && (
            <a
              href={organizer.website}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
            >
              <Globe className="size-3.5" />
              {organizer.website.replace(/^https?:\/\//, "")}
            </a>
          )}
          {organizer.support_email && (
            <a
              href={`mailto:${organizer.support_email}`}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
            >
              <Mail className="size-3.5" />
              {organizer.support_email}
            </a>
          )}
        </div>

        <h2 className="display-3 mt-12 text-ink">Upcoming events</h2>

        {rows.length === 0 ? (
          <EmptyState
            className="mt-6"
            title="Nothing on sale right now"
            description={`Check back for the next ${organizer.name} event.`}
          />
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((event, index) => (
              <EventCard key={event.id} event={event} priority={index < 3} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
