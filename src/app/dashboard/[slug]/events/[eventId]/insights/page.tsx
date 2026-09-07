import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Eye, Ticket, TicketCheck, TrendingUp, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireOrganizer } from "@/lib/auth";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/surface";
import { Meter, StatTile } from "@/components/ui/misc";
import { DashboardBody } from "@/components/dashboard/page-header";
import { PlainCard, SectionBlock } from "@/components/dashboard/tiles";
import { formatMoney, formatNumber } from "@/lib/format";
import type { EventStats } from "@/lib/types";

export const metadata: Metadata = { title: "Insights" };

export default async function InsightsPane({
  params,
}: {
  params: Promise<{ slug: string; eventId: string }>;
}) {
  const { slug, eventId } = await params;
  const { organizer } = await requireOrganizer(slug, "scanner");
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("organizer_id", organizer.id)
    .maybeSingle();

  if (!event) notFound();

  const [{ data: statsData }, { data: ticketTypes }] = await Promise.all([
    supabase.rpc("event_stats", { p_event_id: eventId }),
    supabase.from("ticket_types").select("currency").eq("event_id", eventId).limit(1),
  ]);

  const stats = (statsData ?? {}) as unknown as EventStats;
  const currency = ticketTypes?.[0]?.currency ?? "USD";
  const tiers = stats.by_ticket_type ?? [];
  const sold = stats.tickets_sold ?? 0;

  return (
    <DashboardBody className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Gross revenue"
          value={formatMoney(stats.gross_cents ?? 0, currency)}
          sub={`${formatNumber(stats.orders ?? 0)} orders`}
          icon={Wallet}
        />
        <StatTile
          label="Tickets sold"
          value={formatNumber(sold)}
          sub={`of ${formatNumber(stats.capacity ?? 0)} capacity`}
          icon={Ticket}
        />
        <StatTile
          label="Checked in"
          value={formatNumber(stats.tickets_checked_in ?? 0)}
          sub={
            sold
              ? `${Math.round(((stats.tickets_checked_in ?? 0) / sold) * 100)}% of sold`
              : "No sales yet"
          }
          icon={TicketCheck}
        />
        <StatTile
          label="Page views"
          value={formatNumber(stats.views ?? 0)}
          sub="Since publishing"
          icon={Eye}
        />
      </div>

      <SectionBlock title="Sales by ticket type">
        {tiers.length === 0 ? (
          <PlainCard icon={TrendingUp} tone="positive" title="Not enough data">
            Sales and check-in trends appear here once this event starts getting traffic.
          </PlainCard>
        ) : (
          <Card>
            <CardHeader className="flex-col items-start gap-0">
              <CardTitle>Each tier against its allocation</CardTitle>
              <p className="text-sm text-ink-2">Sold, remaining and gross per tier.</p>
            </CardHeader>
            <CardBody className="space-y-5">
              {tiers.map((tier) => (
                <div key={tier.name}>
                  <div className="flex items-baseline justify-between gap-4 text-base">
                    <span className="font-medium text-ink">{tier.name}</span>
                    <span className="tabular text-ink-2">
                      {formatNumber(tier.sold)} / {formatNumber(tier.total)} ·{" "}
                      <span className="font-semibold text-ink">
                        {formatMoney(tier.gross_cents, currency)}
                      </span>
                    </span>
                  </div>
                  <Meter value={tier.sold} max={tier.total || 1} className="mt-2.5" />
                </div>
              ))}
            </CardBody>
          </Card>
        )}
      </SectionBlock>
    </DashboardBody>
  );
}
