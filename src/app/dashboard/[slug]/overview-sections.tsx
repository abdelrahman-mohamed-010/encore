import Link from "next/link";
import {
  CalendarDays, CreditCard, Plus, Receipt, TicketCheck, Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/surface";
import { StatTile } from "@/components/ui/misc";
import { PlainCard } from "@/features/dashboard/components/tiles";
import { EventFormDrawer } from "@/features/events/components/event-form-drawer";
import { RevenueChart, TicketsChart, type SalesPoint } from "@/features/dashboard/components/sales-chart";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import type { EventStatus, OrganizerStats } from "@/lib/types";

const STATUS_TONE: Record<EventStatus, "positive" | "caution" | "neutral" | "critical"> = {
  published: "positive",
  draft: "neutral",
  pending_review: "caution",
  paused: "caution",
  cancelled: "critical",
  completed: "neutral",
};

export async function PaymentBanner({
  accountPromise,
  slug,
}: {
  accountPromise: PromiseLike<{ charges_enabled: boolean } | null>;
  slug: string;
}) {
  const account = await accountPromise;
  if (account?.charges_enabled) return null;

  return (
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
  );
}

export async function StatsSection({ statsPromise }: { statsPromise: PromiseLike<OrganizerStats> }) {
  const s = await statsPromise;
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

export async function SalesSection({
  statsPromise,
  seriesPromise,
}: {
  statsPromise: PromiseLike<OrganizerStats>;
  seriesPromise: PromiseLike<SalesPoint[]>;
}) {
  const [s, points] = await Promise.all([statsPromise, seriesPromise]);
  const currency = s.currency ?? "USD";

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex-col items-start gap-0">
          <CardTitle>Revenue</CardTitle>
          <p className="text-sm text-ink-2">Gross, last 14 days</p>
        </CardHeader>
        <CardBody className="pt-1">
          <RevenueChart data={points} currency={currency} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex-col items-start gap-0">
          <CardTitle>Tickets issued</CardTitle>
          <p className="text-sm text-ink-2">Per day, last 14 days</p>
        </CardHeader>
        <CardBody className="pt-1">
          <TicketsChart data={points} />
        </CardBody>
      </Card>
    </div>
  );
}

export type RecentEvent = {
  id: string;
  title: string;
  slug: string;
  status: EventStatus;
  starts_at: string;
  cover_image_url: string | null;
};

export async function RecentEventsSection({
  eventsPromise,
  slug,
  organizerId,
}: {
  eventsPromise: PromiseLike<RecentEvent[]>;
  slug: string;
  organizerId: string;
}) {
  const events = await eventsPromise;

  if (!events || events.length === 0) {
    return (
      <PlainCard
        icon={CalendarDays}
        tone="violet"
        title="No events yet"
        action={
          <EventFormDrawer
            organizerId={organizerId}
            organizerSlug={slug}
            trigger={
              <Button variant="solid" size="sm">
                <Plus /> New event
              </Button>
            }
          />
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
  );
}
