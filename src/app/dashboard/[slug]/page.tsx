import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowUpRight, CalendarDays, CreditCard, Megaphone, Plus, QrCode, Receipt,
  Share2, TicketCheck, Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireOrganizer } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle, Divider } from "@/components/ui/surface";
import { StatTile } from "@/components/ui/misc";
import { DashboardBody, DashboardHeader } from "@/components/dashboard/page-header";
import { PlainCard, QuickAction, SectionBlock } from "@/components/dashboard/tiles";
import { RevenueChart, TicketsChart, type SalesPoint } from "@/components/dashboard/sales-chart";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import type { EventStatus, OrganizerStats } from "@/lib/types";

export const metadata: Metadata = { title: "Overview" };

const STATUS_TONE: Record<EventStatus, "positive" | "caution" | "neutral" | "critical"> = {
  published: "positive",
  draft: "neutral",
  pending_review: "caution",
  paused: "caution",
  cancelled: "critical",
  completed: "neutral",
};

export default async function DashboardOverview({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organizer } = await requireOrganizer(slug, "scanner");
  const supabase = await createClient();

  const [{ data: stats }, { data: series }, { data: events }, { data: account }] = await Promise.all([
    supabase.rpc("organizer_stats", { p_organizer_id: organizer.id }),
    supabase.rpc("organizer_sales_series", { p_organizer_id: organizer.id, p_days: 30 }),
    supabase
      .from("events")
      .select("id, title, slug, status, starts_at, cover_image_url")
      .eq("organizer_id", organizer.id)
      .order("starts_at", { ascending: true })
      .limit(6),
    supabase
      .from("payment_accounts")
      .select("charges_enabled, stripe_account_id")
      .eq("organizer_id", organizer.id)
      .maybeSingle(),
  ]);

  const s = (stats ?? {}) as unknown as OrganizerStats;
  const points = (series ?? []) as SalesPoint[];
  const currency = s.currency ?? "USD";
  const canSell = Boolean(account?.charges_enabled);

  return (
    <>
      <DashboardHeader
        crumb={{ label: organizer.name, href: `/organizers/${organizer.slug}` }}
        title="Overview"
        description={`How ${organizer.name} is doing over the last 30 days.`}
        actions={
          <Button asChild variant="solid" size="md">
            <Link href={`/dashboard/${slug}/events/new`}>
              <Plus /> New event
            </Link>
          </Button>
        }
      />

      <DashboardBody className="space-y-10">
        {/* The three things an organizer does between sessions. */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction
            icon={Megaphone}
            tone="blue"
            label="Invite guests"
            value="Share the event page"
            href={`/dashboard/${slug}/events`}
          />
          <QuickAction
            icon={QrCode}
            tone="violet"
            label="Check in"
            value="Scan at the door"
            href={`/dashboard/${slug}/scan`}
          />
          <QuickAction
            icon={Share2}
            tone="pink"
            label="Public page"
            value={`/organizers/${organizer.slug}`}
            href={`/organizers/${organizer.slug}`}
          />
        </div>

        {!canSell && (
          <PlainCard
            icon={CreditCard}
            tone="caution"
            title="Connect Stripe to take card payments"
            action={
              <Button asChild variant="soft" size="sm">
                <Link href={`/dashboard/${slug}/settings/payments`}>Get started</Link>
              </Button>
            }
          >
            Until then, paid orders settle through the built-in sandbox rail and no real
            money moves.
          </PlainCard>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="Gross revenue"
            value={formatMoney(s.gross_cents ?? 0, currency)}
            sub={`${formatNumber(s.orders_paid ?? 0)} paid orders`}
            icon={Wallet}
          />
          <StatTile
            label="Net to you"
            value={formatMoney(s.net_cents ?? 0, currency)}
            sub={`after ${formatMoney(s.platform_fees_cents ?? 0, currency)} fees`}
            icon={Receipt}
          />
          <StatTile
            label="Tickets sold"
            value={formatNumber(s.tickets_sold ?? 0)}
            sub={`${formatNumber(s.tickets_checked_in ?? 0)} checked in`}
            icon={TicketCheck}
          />
          <StatTile
            label="Published events"
            value={formatNumber(s.events_published ?? 0)}
            sub={`${formatNumber(s.events_upcoming ?? 0)} upcoming`}
            icon={CalendarDays}
          />
        </div>

        <Divider />

        <SectionBlock title="Sales" description="Gross revenue and tickets issued, last 30 days.">
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex-col items-start gap-0">
                <CardTitle>Revenue</CardTitle>
                <p className="text-sm text-ink-2">Gross, last 30 days</p>
              </CardHeader>
              <CardBody className="pt-1">
                <RevenueChart data={points} currency={currency} />
              </CardBody>
            </Card>

            <Card>
              <CardHeader className="flex-col items-start gap-0">
                <CardTitle>Tickets issued</CardTitle>
                <p className="text-sm text-ink-2">Per day, last 30 days</p>
              </CardHeader>
              <CardBody className="pt-1">
                <TicketsChart data={points} />
              </CardBody>
            </Card>
          </div>
        </SectionBlock>

        <Divider />

        <SectionBlock
          title="Your events"
          action={
            <Button asChild variant="soft" size="sm">
              <Link href={`/dashboard/${slug}/events`}>
                All events <ArrowUpRight />
              </Link>
            </Button>
          }
        >
          {events && events.length > 0 ? (
            <ul className="space-y-2">
              {events.map((event) => (
                <li key={event.id}>
                  <Link
                    href={`/dashboard/${slug}/events/${event.id}`}
                    className="flex items-center gap-4 rounded-xl bg-card px-5 py-3.5 shadow-e1 transition-shadow hover:shadow-e2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-flourish text-lg text-ink">{event.title}</p>
                      <p className="mt-0.5 text-sm text-ink-2">
                        {formatDate(event.starts_at, "medium")}
                      </p>
                    </div>
                    <Badge tone={STATUS_TONE[event.status]} size="sm">
                      {event.status.replace("_", " ")}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <PlainCard
              icon={CalendarDays}
              tone="violet"
              title="No events yet"
              action={
                <Button asChild variant="solid" size="sm">
                  <Link href={`/dashboard/${slug}/events/new`}>
                    <Plus /> New event
                  </Link>
                </Button>
              }
            >
              Create your first event and start selling.
            </PlainCard>
          )}
        </SectionBlock>
      </DashboardBody>
    </>
  );
}
