import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Copy, ExternalLink, Pencil, Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireOrganizer } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { DashboardBody } from "@/components/dashboard/page-header";
import { PlainCard, SectionBlock } from "@/components/dashboard/tiles";

export const metadata: Metadata = { title: "More" };

export default async function MorePane({
  params,
}: {
  params: Promise<{ slug: string; eventId: string }>;
}) {
  const { slug, eventId } = await params;
  const { organizer, role } = await requireOrganizer(slug, "scanner");
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, slug, status")
    .eq("id", eventId)
    .eq("organizer_id", organizer.id)
    .maybeSingle();

  if (!event) notFound();

  const canEdit = role === "owner" || role === "admin" || role === "staff";
  const base = `/dashboard/${slug}/events/${eventId}`;

  return (
    <DashboardBody className="space-y-10">
      <SectionBlock title="Event details" description="Title, description, timing, venue and cover.">
        <PlainCard
          icon={Pencil}
          tone="violet"
          title="Edit this event"
          action={
            canEdit ? (
              <Button asChild variant="soft" size="sm">
                <Link href={`${base}/edit`}>Open editor</Link>
              </Button>
            ) : undefined
          }
        >
          Changes go live immediately on the public page.
        </PlainCard>
      </SectionBlock>

      <SectionBlock title="Promotion" description="Discount codes apply across your events.">
        <PlainCard
          icon={Tag}
          tone="amber"
          title="Promo codes"
          action={
            <Button asChild variant="soft" size="sm">
              <Link href={`/dashboard/${slug}/promos`}>Manage codes</Link>
            </Button>
          }
        >
          Create a percentage or fixed-amount code and scope it to this event.
        </PlainCard>
      </SectionBlock>

      <SectionBlock title="The public page">
        <PlainCard
          icon={event.status === "published" ? ExternalLink : Copy}
          tone="blue"
          title={event.status === "published" ? "Live now" : "Not published"}
          action={
            event.status === "published" ? (
              <Button asChild variant="soft" size="sm">
                <Link href={`/events/${event.slug}`} target="_blank">
                  View <ExternalLink />
                </Link>
              </Button>
            ) : undefined
          }
        >
          {event.status === "published"
            ? "Anyone with the link can see this event and buy a ticket."
            : "Publish from the status control at the top of this page to make it visible."}
        </PlainCard>
      </SectionBlock>
    </DashboardBody>
  );
}
