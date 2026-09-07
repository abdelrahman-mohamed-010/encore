import Link from "next/link";
import { Suspense } from "react";
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
import { Skeleton, SkeletonRows } from "@/components/ui/skeleton";
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

  // Only the payment banner is awaited here: it decides whether a whole block
  // appears at all, so it cannot be streamed in behind a placeholder. Every
  // other query lives in its own component below and suspends on its own.
  const { data: account } = await supabase
    .from("payment_accounts")
    .select("charges_enabled, stripe_account_id")
    .eq("organizer_id", organizer.id)
    .maybeSingle();

  const canSell = Boolean(account?.charges_enabled);

  return (
    <div className="space-y-8">
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

      <Suspense fallback={<StatsFallback />}>
        <Stats organizerId={organizer.id} />
      </Suspense>

      <Divider />

      <SectionBlock title="Sales" description="Gross revenue and tickets issued, last 14 days.">
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex-col items-start gap-0">
              <CardTitle>Revenue</CardTitle>
              <p className="text-sm text-ink-2">Gross, last 14 days</p>
            </CardHeader>
            <CardBody className="pt-1">
              <Suspense fallback={<Skeleton className="h-56 rounded-lg" />}>
                <Revenue organizerId={organizer.id} />
              </Suspense>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex-col items-start gap-0">
              <CardTitle>Tickets issued</CardTitle>
              <p className="text-sm text-ink-2">Per day, last 14 days</p>
            </CardHeader>
            <CardBody className="pt-1">
              <Suspense fallback={<Skeleton className="h-56 rounded-lg" />}>
                <Tickets organizerId={organizer.id} />
              </Suspense>
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
        <Suspense fallback={<SkeletonRows rows={4} height="h-[4.25rem]" />}>
          <UpcomingEvents organizerId={organizer.id} slug={slug} />
        </Suspense>
      </SectionBlock>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * The page's data, one component per query.
 *
 * Each is awaited inside its own <Suspense> above, so a slow figure never
 * holds up the headings, the section copy or the cards around it — and the
 * placeholder it falls back to covers only its own footprint.
 * ---------------------------------------------------------------------- */

function StatsFallback() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-[6.75rem] rounded-xl" />
      ))}
    </div>
  );
}

async function Stats({ organizerId }: { organizerId: string }) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("organizer_stats", { p_organizer_id: organizerId });
  const s = (data ?? {}) as unknown as OrganizerStats;
  const currency = s.currency ?? "USD";

  return (
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
  );
}

/** The 14-day series, shared by both charts. */
async function salesSeries(organizerId: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("organizer_sales_series", {
    p_organizer_id: organizerId,
    p_days: 14,
  });
  return (data ?? []) as SalesPoint[];
}

async function Revenue({ organizerId }: { organizerId: string }) {
  const supabase = await createClient();
  const [points, { data: stats }] = await Promise.all([
    salesSeries(organizerId),
    supabase.rpc("organizer_stats", { p_organizer_id: organizerId }),
  ]);
  const currency = ((stats ?? {}) as unknown as OrganizerStats).currency ?? "USD";
  return <RevenueChart data={points} currency={currency} />;
}

async function Tickets({ organizerId }: { organizerId: string }) {
  return <TicketsChart data={await salesSeries(organizerId)} />;
}

async function UpcomingEvents({ organizerId, slug }: { organizerId: string; slug: string }) {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, title, slug, status, starts_at, cover_image_url")
    .eq("organizer_id", organizerId)
    .order("starts_at", { ascending: true })
    .limit(6);

  if (!events || events.length === 0) {
    return (
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
    );
  }

  return (
    <ul className="space-y-2">
      {events.map((event) => (
        <li key={event.id}>
          <Link
            href={`/dashboard/${slug}/events/${event.id}`}
            className="flex items-center gap-4 rounded-xl bg-card px-5 py-3.5 transition-colors hover:bg-sunken/60"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-flourish text-lg text-ink">{event.title}</p>
              <p className="mt-0.5 text-sm text-ink-2">{formatDate(event.starts_at, "medium")}</p>
            </div>
            <Badge tone={STATUS_TONE[event.status]} size="sm">
              {event.status.replace("_", " ")}
            </Badge>
          </Link>
        </li>
      ))}
    </ul>
  );
}
