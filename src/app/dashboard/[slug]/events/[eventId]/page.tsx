import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  AlertTriangle, CalendarDays, Eye, Globe, Link2, Mail, MessageCircle, Pencil,
  QrCode, Send, Share2, ShieldCheck, Sparkles, Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireOrganizer } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/surface";
import { Avatar } from "@/components/ui/misc";
import { InfoRow } from "@/components/ui/field-row";
import { DashboardBody } from "@/components/dashboard/page-header";
import { PlainCard, QuickAction, SectionBlock } from "@/components/dashboard/tiles";
import { EventPreview } from "@/components/dashboard/event-preview";
import { formatDate, formatTime, pluralize } from "@/lib/format";
import type { EventStats } from "@/lib/types";

export const metadata: Metadata = { title: "Manage event" };

export default async function ManageEventOverview({
  params,
}: {
  params: Promise<{ slug: string; eventId: string }>;
}) {
  const { slug, eventId } = await params;
  const { organizer, role } = await requireOrganizer(slug, "scanner");
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("*, venue:venues(name, city, address_line1), category:categories(name)")
    .eq("id", eventId)
    .eq("organizer_id", organizer.id)
    .maybeSingle();

  if (!event) notFound();

  const [{ data: statsData }, { data: owner }] = await Promise.all([
    supabase.rpc("event_stats", { p_event_id: eventId }),
    supabase
      .from("public_profiles")
      .select("id, full_name, avatar_url")
      .eq("id", organizer.owner_id)
      .maybeSingle(),
  ]);

  const stats = (statsData ?? {}) as unknown as EventStats;
  const canEdit = role === "owner" || role === "admin" || role === "staff";
  const tz = event.timezone ?? undefined;
  const base = `/dashboard/${slug}/events/${eventId}`;

  // The two things that stop an event going live, called out where the
  // organizer is already looking rather than buried in the edit form.
  const missingVenue = !event.is_online && !event.venue;
  const notPublished = event.status !== "published";

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "tazkarti.app";
  const publicUrl = `${siteUrl.replace(/^https?:\/\//, "")}/events/${event.slug}`;

  return (
    <DashboardBody className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickAction
          icon={Send}
          tone="blue"
          label="Invite guests"
          value="Share the link"
          href={`/events/${event.slug}`}
        />
        <QuickAction
          icon={Users}
          tone="violet"
          label="Guests"
          value={pluralize(stats.tickets_sold ?? 0, "ticket")}
          href={`${base}/guests`}
        />
        <QuickAction
          icon={QrCode}
          tone="pink"
          label="Check in"
          value={`${stats.tickets_checked_in ?? 0} scanned`}
          href={`/dashboard/${slug}/scan`}
        />
      </div>

      {/* ---- The event card: what people see, and when & where ------------- */}
      <div className="rounded-2xl bg-card p-4 shadow-e1">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          <EventPreview
            title={event.title}
            coverUrl={event.cover_image_url}
            hostName={organizer.name}
            hostLogoUrl={organizer.logo_url}
            startsAt={event.starts_at}
            endsAt={event.ends_at}
            timezone={tz}
            venueName={event.venue?.name}
            city={event.venue?.city}
            isOnline={event.is_online}
            requiresApproval={false}
            publicUrl={publicUrl}
          />

          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-ink">When &amp; where</h2>

            <div className="mt-6 space-y-6">
              <InfoRow
                date={event.starts_at}
                timeZone={tz}
                main={formatDate(event.starts_at, "full", tz)}
                sub={`${formatTime(event.starts_at, tz)} – ${formatTime(event.ends_at, tz)}${
                  tz ? ` · ${tz.replace("_", " ")}` : ""
                }`}
              />

              {missingVenue ? (
                <InfoRow
                  icon={AlertTriangle}
                  main={<span className="text-caution">Location missing</span>}
                  sub="Add a venue before the event starts, or mark it as online."
                />
              ) : (
                <InfoRow
                  icon={event.is_online ? Globe : CalendarDays}
                  main={event.is_online ? "Online event" : event.venue?.name ?? ""}
                  sub={
                    event.is_online
                      ? "A joining link is sent with every ticket"
                      : [event.venue?.address_line1, event.venue?.city]
                          .filter(Boolean)
                          .join(", ")
                  }
                />
              )}

              <InfoRow
                icon={Eye}
                main={`${stats.views ?? 0} page views`}
                sub={notPublished ? "Not published yet" : "Since publishing"}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-5 text-base text-ink-2">
            Share event
            <span className="flex items-center gap-4 text-ink-3">
              <Link2 className="size-[18px]" aria-hidden />
              <Mail className="size-[18px]" aria-hidden />
              <MessageCircle className="size-[18px]" aria-hidden />
              <Share2 className="size-[18px]" aria-hidden />
            </span>
          </div>

          {canEdit && (
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="soft" size="md" className="min-w-40">
                <Link href={`${base}/edit`}>Edit event</Link>
              </Button>
              <Button asChild variant="soft" size="md" className="min-w-40">
                <Link href={`${base}/edit#cover`}>Change photo</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ---- Guests -------------------------------------------------------- */}
      <SectionBlock
        title="Guests"
        description="Everyone holding a ticket to this event."
        action={
          <Button asChild variant="soft" size="sm">
            <Link href={`${base}/guests`}>View all</Link>
          </Button>
        }
      >
        {(stats.tickets_sold ?? 0) > 0 ? (
          <PlainCard
            icon={Users}
            tone="blue"
            title={`${pluralize(stats.tickets_sold ?? 0, "guest")} registered`}
          >
            {stats.tickets_checked_in ?? 0} checked in so far.
          </PlainCard>
        ) : (
          <PlainCard icon={Send} tone="blue" title="No registrations yet">
            Share the event page to start collecting them.
          </PlainCard>
        )}
      </SectionBlock>

      <Divider />

      {/* ---- Hosts --------------------------------------------------------- */}
      <SectionBlock
        title="Hosts"
        action={
          role === "owner" || role === "admin" ? (
            <Button asChild variant="soft" size="sm">
              <Link href={`/dashboard/${slug}/team`}>Add host</Link>
            </Button>
          ) : undefined
        }
      >
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-card px-5 py-3.5 shadow-e1">
          <Avatar src={owner?.avatar_url} name={owner?.full_name ?? organizer.name} size="sm" />
          <span className="text-md font-semibold text-ink">
            {owner?.full_name ?? organizer.name}
          </span>
          <Badge tone="positive" size="sm">Creator</Badge>
          {canEdit && (
            <Link
              href={`/dashboard/${slug}/team`}
              aria-label="Manage hosts"
              className="ml-auto text-ink-3 transition-colors hover:text-ink"
            >
              <Pencil className="size-[18px]" />
            </Link>
          )}
        </div>

        <Link
          href={`/dashboard/${slug}/scan`}
          className="mt-5 inline-flex items-center gap-2 text-md text-ink-2 transition-colors hover:text-ink"
        >
          <QrCode className="size-[17px]" />
          Manage check-in staff and options
        </Link>
      </SectionBlock>

      <Divider />

      {/* ---- Visibility ---------------------------------------------------- */}
      <SectionBlock title="Visibility & discovery" description="Control how people find this event.">
        <div className="flex gap-4 rounded-2xl bg-card p-5 shadow-e1">
          <Avatar src={organizer.logo_url} name={organizer.name} size="lg" />
          <div className="min-w-0">
            <p className="text-base text-ink-2">Managing organization</p>
            <p className="mt-0.5 text-md font-medium text-ink">{organizer.name}</p>

            <p className="mt-2 flex flex-wrap items-center gap-2 text-base text-ink-2">
              <span className="flex items-center gap-1.5 font-semibold text-positive">
                {notPublished ? (
                  <>
                    <ShieldCheck className="size-[17px]" />
                    {event.status.replace("_", " ")}
                  </>
                ) : (
                  <>
                    <Globe className="size-[17px]" />
                    Public
                  </>
                )}
              </span>
              —{" "}
              {notPublished
                ? "this event is not listed anywhere yet."
                : "this event is listed on your organizer page."}
            </p>

            {canEdit && (
              <div className="mt-4 flex flex-wrap gap-2.5">
                <Button asChild variant="soft" size="sm">
                  <Link href={`${base}/edit`}>
                    <Eye /> Change visibility
                  </Link>
                </Button>
                <Button asChild variant="soft" size="sm">
                  <Link href={`/dashboard/${slug}/settings`}>Organization settings</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        <p className="mt-5 flex gap-3.5 text-base leading-relaxed text-ink-2">
          <Sparkles className="mt-1 size-[18px] shrink-0 text-ink-3" />
          Events listed in a category are shown on the browse page and in search, so people
          who have never heard of you can still find them.
        </p>
      </SectionBlock>
    </DashboardBody>
  );
}
