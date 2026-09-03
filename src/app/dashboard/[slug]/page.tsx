import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowUpRight, CalendarDays, CreditCard, Plus, Receipt, TicketCheck, Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireOrganizer } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardBody, SectionHeader } from "@/components/ui/surface";
import { EmptyState, StatTile } from "@/components/ui/misc";
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
    <div className="space-y-8">
      <SectionHeader
        level={1}
        title="Overview"
        description={`How ${organizer.name} is doing over the last 30 days.`}
        action={
          <Button asChild variant="solid" size="md">
            <Link href={`/dashboard/${slug}/events/new`}><Plus /> New event</Link>
          </Button>
        }
      />

      {!canSell && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-transparent bg-caution-bg px-4 py-3.5">
          <div className="flex items-start gap-3">
            <CreditCard className="mt-0.5 size-4 shrink-0 text-caution" />
            <div>
              <p className="text-[13.5px] font-medium text-ink">Connect Stripe to take card payments</p>
              <p className="mt-0.5 text-[12.5px] text-ink-2">
                Until then, paid orders settle through the built-in sandbox rail and no real money moves.
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/${slug}/settings/payments`}>Connect Stripe</Link>
          </Button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader bordered className="flex-col items-start">
            <CardTitle>Revenue</CardTitle>
            <p className="text-[12.5px] text-ink-3">Gross, last 30 days</p>
          </CardHeader>
          <CardBody>
            <RevenueChart data={points} currency={currency} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader bordered className="flex-col items-start">
            <CardTitle>Tickets issued</CardTitle>
            <p className="text-[12.5px] text-ink-3">Per day, last 30 days</p>
          </CardHeader>
          <CardBody>
            <TicketsChart data={points} />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader bordered>
          <CardTitle>Your events</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/dashboard/${slug}/events`}>All events <ArrowUpRight /></Link>
          </Button>
        </CardHeader>

        {events && events.length > 0 ? (
          <div>
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/dashboard/${slug}/events/${event.id}`}
                className="flex items-center gap-4 border-b border-hairline-soft px-5 py-3.5 transition-colors last:border-b-0 hover:bg-sunken"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-ink">{event.title}</p>
                  <p className="mt-0.5 text-[12.5px] text-ink-3">
                    {formatDate(event.starts_at, "medium")}
                  </p>
                </div>
                <Badge tone={STATUS_TONE[event.status]} size="xs">
                  {event.status.replace("_", " ")}
                </Badge>
              </Link>
            ))}
          </div>
        ) : (
          <CardBody>
            <EmptyState
              icon={CalendarDays}
              title="No events yet"
              description="Create your first event and start selling."
              action={
                <Button asChild variant="solid" size="md">
                  <Link href={`/dashboard/${slug}/events/new`}><Plus /> New event</Link>
                </Button>
              }
            />
          </CardBody>
        )}
      </Card>
    </div>
  );
}
