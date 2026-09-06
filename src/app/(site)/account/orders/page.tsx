import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowRight, CalendarDays, MapPin, Receipt, Ticket } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateBlock } from "@/components/ui/field-row";
import { EmptyState } from "@/components/ui/misc";
import { formatDate, formatEventStamp, formatMoney, pluralize } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Orders" };

const TONE: Record<OrderStatus, "positive" | "caution" | "critical" | "neutral"> = {
  paid: "positive",
  pending: "caution",
  failed: "critical",
  cancelled: "neutral",
  refunded: "critical",
  partially_refunded: "caution",
};

export default async function OrdersPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select(
      `id, order_number, status, total_cents, currency, created_at, refunded_cents,
       event:events(id, title, slug, cover_image_url, starts_at, ends_at, timezone, is_online, venue:venues(name, city)),
       tickets:tickets(count)`,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (!orders || orders.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No orders yet"
        description="Your purchase history and ticket receipts will show up here."
        action={
          <Button asChild variant="solid" size="md">
            <Link href="/events">Discover events</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const ticketCount = (order.tickets as unknown as { count: number }[])?.[0]?.count ?? 0;
        const event = order.event;

        return (
          <article
            key={order.id}
            className="group overflow-hidden rounded-2xl bg-card"
          >
            <div className="flex gap-4 p-4 sm:p-5">
              {/* Date block or thumbnail */}
              <div className="hidden sm:block">
                {event?.starts_at ? (
                  <DateBlock
                    date={event.starts_at}
                    timeZone={event.timezone ?? undefined}
                    className="size-14"
                  />
                ) : (
                  <div className="grid size-14 shrink-0 place-items-center rounded-lg bg-sunken text-ink-3">
                    <Receipt className="size-5 opacity-50" />
                  </div>
                )}
              </div>

              {/* Event thumbnail (mobile: shown; desktop: shown alongside date block) */}
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-sunken sm:size-14">
                {event?.cover_image_url ? (
                  <Image
                    src={event.cover_image_url}
                    alt={event.title ?? "Event cover"}
                    fill
                    sizes="64px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-gradient-to-br from-sunken to-sunken-2 text-ink-3">
                    <Ticket className="size-6 opacity-40" />
                  </div>
                )}
              </div>

              {/* Order info */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={TONE[order.status]} size="xs">
                    {order.status.replace("_", " ")}
                  </Badge>
                  {ticketCount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-sunken px-1.5 py-0.5 text-2xs font-medium text-ink-2">
                      <Ticket className="size-2.5 text-ink-3" />
                      {pluralize(ticketCount, "ticket")}
                    </span>
                  )}
                </div>

                <Link href={`/account/orders/${order.id}`}>
                  <h2 className="mt-1.5 truncate text-lg font-bold text-ink transition-colors group-hover:text-ink-2">
                    {event?.title ?? "Event"}
                  </h2>
                </Link>

                {event && (
                  <div className="mt-2 flex flex-col gap-1 text-xs text-ink-2">
                    <p className="flex items-center gap-1.5">
                      <CalendarDays className="size-3.5 shrink-0 text-ink-3" />
                      {formatEventStamp(event.starts_at, event.timezone ?? undefined)}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="size-3.5 shrink-0 text-ink-3" />
                      <span className="truncate">
                        {event.is_online
                          ? "Online event"
                          : [event.venue?.name, event.venue?.city].filter(Boolean).join(" · ") || "Venue TBA"}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Price + action */}
              <div className="flex shrink-0 flex-col items-end justify-between">
                <div className="text-right">
                  <span className="text-lg font-bold tabular-nums text-ink">
                    {formatMoney(order.total_cents, order.currency)}
                  </span>
                  {order.refunded_cents > 0 && (
                    <span className="block text-2xs text-critical">
                      {formatMoney(order.refunded_cents, order.currency)} refunded
                    </span>
                  )}
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <span className="hidden text-2xs text-ink-3 sm:inline">
                    {formatDate(order.created_at, "short")}
                  </span>
                  <Button asChild variant="ghost" size="sm" className="gap-1 rounded-lg text-xs">
                    <Link href={`/account/orders/${order.id}`}>
                      Details <ArrowRight className="size-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
