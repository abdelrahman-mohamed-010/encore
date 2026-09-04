import Link from "next/link";
import type { Metadata } from "next";
import { Building2, CalendarCheck, Ticket, Users, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardBody, SectionHeader } from "@/components/ui/surface";
import { StatTile } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import type { PlatformStats } from "@/lib/types";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminOverview() {
  const supabase = await createClient();

  const [{ data: statsData }, { data: pending }] = await Promise.all([
    supabase.rpc("admin_platform_stats"),
    supabase
      .from("events")
      .select("id, title, slug, starts_at, organizer:organizers(name)")
      .eq("status", "pending_review")
      .order("created_at", { ascending: true })
      .limit(8),
  ]);

  const stats = (statsData ?? {}) as unknown as PlatformStats;

  return (
    <div className="space-y-8">
      <SectionHeader
        level={1}
        title="Platform overview"
        description="Everything happening across every organizer on Tazkarti."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Gross volume"
          value={formatMoney(stats.gross_cents ?? 0)}
          sub={`${formatMoney(stats.platform_fees_cents ?? 0)} in platform fees`}
          icon={Wallet}
        />
        <StatTile
          label="Tickets sold"
          value={formatNumber(stats.tickets_sold ?? 0)}
          sub={`${formatNumber(stats.orders_paid ?? 0)} paid orders`}
          icon={Ticket}
        />
        <StatTile
          label="Organizers"
          value={formatNumber(stats.organizers ?? 0)}
          sub={`${formatNumber(stats.users ?? 0)} users`}
          icon={Building2}
        />
        <StatTile
          label="Published events"
          value={formatNumber(stats.events_published ?? 0)}
          sub={`${formatNumber(stats.events_pending ?? 0)} awaiting review`}
          icon={CalendarCheck}
        />
      </div>

      <Card>
        <CardHeader bordered>
          <CardTitle>Awaiting review</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/events">Review queue</Link>
          </Button>
        </CardHeader>

        {!pending || pending.length === 0 ? (
          <CardBody>
            <p className="text-sm text-ink-3">Nothing is waiting for approval.</p>
          </CardBody>
        ) : (
          <div>
            {pending.map((event) => (
              <Link
                key={event.id}
                href="/admin/events"
                className="flex items-center gap-4 border-b border-hairline-soft px-5 py-3.5 transition-colors last:border-b-0 hover:bg-sunken"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-medium text-ink">{event.title}</p>
                  <p className="mt-0.5 truncate text-xs text-ink-3">
                    {event.organizer?.name} · {formatDate(event.starts_at, "medium")}
                  </p>
                </div>
                <Badge tone="caution" size="xs">Pending</Badge>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader bordered>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-4 text-ink-3" />
            Quick links
          </CardTitle>
        </CardHeader>
        <CardBody className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm"><Link href="/admin/events">Event review</Link></Button>
          <Button asChild variant="outline" size="sm"><Link href="/admin/users">Users</Link></Button>
          <Button asChild variant="outline" size="sm"><Link href="/admin/categories">Categories</Link></Button>
        </CardBody>
      </Card>
    </div>
  );
}
