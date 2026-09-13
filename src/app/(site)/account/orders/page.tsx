import Link from "next/link";
import { OrderStatusBadge } from "@/components/ui/status-badge";
import Image from "next/image";
import type { Metadata } from "next";
import { CalendarDays, MapPin, Receipt, Ticket } from "lucide-react";
import { listMyOrders } from "@/features/account/queries";
import { requireUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";

import { EmptyState } from "@/components/ui/empty-state";
import { formatEventStamp, formatMoney, pluralize } from "@/lib/format";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await listMyOrders(user.id);

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
        const venueLabel = event
          ? event.is_online
            ? "Online event"
            : [event.venue?.name, event.venue?.city].filter(Boolean).join(" · ") || "Venue TBA"
          : null;

        return (
          <Link
            key={order.id}
            href={`/account/orders/${order.id}`}
            className="group flex items-center gap-4 rounded-2xl bg-card p-4 sm:gap-5 sm:p-5"
          >
            <div className="min-w-0 flex-1">
              {event && (
                <p className="flex items-center gap-1.5 text-sm font-semibold text-amber">
                  <CalendarDays className="size-3.5 shrink-0" />
                  {formatEventStamp(event.starts_at, event.timezone ?? undefined)}
                </p>
              )}
              <h2 className="mt-1.5 truncate text-lg font-bold text-ink">
                {event?.title ?? "Event"}
              </h2>
              {venueLabel && (
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-2">
                  <MapPin className="size-3.5 shrink-0 text-ink-3" />
                  <span className="truncate">{venueLabel}</span>
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <OrderStatusBadge status={order.status} size="xs" />
                {ticketCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-sunken px-2 py-1 text-xs font-medium text-ink-2">
                    <Ticket className="size-3 text-ink-3" />
                    {pluralize(ticketCount, "ticket")}
                  </span>
                )}
                {order.refunded_cents > 0 && (
                  <span className="text-xs font-medium text-critical">
                    {formatMoney(order.refunded_cents, order.currency)} refunded
                  </span>
                )}
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-3">
              <div className="relative size-20 overflow-hidden rounded-lg bg-sunken sm:size-24">
                {event?.cover_image_url ? (
                  <Image
                    src={event.cover_image_url}
                    alt=""
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-gradient-to-br from-sunken to-sunken-2 text-ink-3">
                    <Ticket className="size-6 opacity-40" />
                  </div>
                )}
              </div>
              <span className="text-lg font-bold tabular text-ink">
                {formatMoney(order.total_cents, order.currency)}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
