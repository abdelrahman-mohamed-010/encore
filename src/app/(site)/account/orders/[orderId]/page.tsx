import Link from "next/link";
import { OrderStatusBadge } from "@/components/ui/status-badge";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, CalendarDays, Download, MapPin, Receipt, Ticket } from "lucide-react";
import { getMyOrder } from "@/features/account/queries";
import { requireUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, Divider } from "@/components/ui/surface";
import { FieldRow } from "@/components/ui/field-row";

import { SummaryLine } from "@/components/ui/stat-tile";
import { OrderCelebration } from "./celebration";
import { formatDateTime, formatEventStamp, formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Order" };

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ celebrate?: string }>;
}) {
  const { orderId } = await params;
  const { celebrate } = await searchParams;
  const user = await requireUser();
  const order = await getMyOrder(orderId);

  if (!order || order.user_id !== user.id) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      {celebrate === "1" && order.status === "paid" && <OrderCelebration />}

      <Link
        href="/account/orders"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-3 transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" />
        All orders
      </Link>

      {/* Event banner */}
      {order.event?.cover_image_url && (
        <div className="relative mb-6 h-32 overflow-hidden rounded-2xl bg-sunken sm:h-40">
          <Image
            src={order.event.cover_image_url}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 700px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <h1 className="text-xl font-bold text-white drop-shadow-sm sm:text-2xl">
              {order.event?.title}
            </h1>
            <p className="mt-1 font-mono text-xs text-white/70">{order.order_number}</p>
          </div>
          <div className="absolute right-4 top-4">
            <OrderStatusBadge status={order.status} size="md" className="shadow-sm" />
          </div>
        </div>
      )}

      {/* Fallback header when no cover image */}
      {!order.event?.cover_image_url && (
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="display-3 text-ink">{order.event?.title}</h1>
            <p className="mt-1.5 font-mono text-sm text-ink-3">{order.order_number}</p>
          </div>
          <OrderStatusBadge status={order.status} size="md" />
        </div>
      )}

      {/* Event details + order date */}
      <Card className="overflow-hidden">
        <FieldRow
          icon={CalendarDays}
          label="Event starts"
          value={
            order.event
              ? formatEventStamp(order.event.starts_at, order.event.timezone ?? undefined)
              : "—"
          }
        />
        <FieldRow
          icon={MapPin}
          label={order.event?.is_online ? "Online event" : "Venue"}
          value={
            order.event?.is_online
              ? "A joining link is sent with your ticket"
              : [order.event?.venue?.name, order.event?.venue?.city].filter(Boolean).join(" · ") || "—"
          }
        />
        <FieldRow icon={Receipt} label="Ordered" value={formatDateTime(order.created_at)} />
      </Card>

      {/* Items + summary — merged into one card */}
      <Card className="mt-5 overflow-hidden">
        <div className="border-b border-hairline-soft px-4 py-3.5">
          <h2 className="text-base font-semibold text-ink">Items</h2>
        </div>
        <div className="space-y-3 p-4">
          {order.items?.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="text-ink">
                  {item.quantity} × {item.ticket_type_name}
                </p>
                {item.seat_label && (
                  <p className="mt-0.5 text-xs text-ink-3">{item.seat_label}</p>
                )}
              </div>
              <span className="shrink-0 tabular text-ink">
                {formatMoney(item.subtotal_cents, order.currency)}
              </span>
            </div>
          ))}
        </div>

        <Divider />

        <div className="space-y-2.5 p-4">
          <SummaryLine label="Subtotal" value={formatMoney(order.subtotal_cents, order.currency)} />
          {order.discount_cents > 0 && (
            <SummaryLine
              label="Discount"
              value={`−${formatMoney(order.discount_cents, order.currency)}`}
              className="text-positive"
            />
          )}
          <SummaryLine label="Service fee" value={formatMoney(order.fee_cents, order.currency)} />
          {order.refunded_cents > 0 && (
            <SummaryLine
              label="Refunded"
              value={`−${formatMoney(order.refunded_cents, order.currency)}`}
              className="text-critical"
            />
          )}
          <Divider className="!my-3" />
          <SummaryLine label="Total" value={formatMoney(order.total_cents, order.currency)} strong />
        </div>
      </Card>

      {/* Tickets */}
      {order.tickets && order.tickets.length > 0 && (
        <Card className="mt-5 overflow-hidden">
          <div className="flex items-center justify-between border-b border-hairline-soft px-4 py-3.5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
              <Ticket className="size-4 text-ink-3" />
              Tickets ({order.tickets.length})
            </h2>
            <Button asChild variant="outline" size="sm">
              <Link href="/account/tickets">Open tickets</Link>
            </Button>
          </div>
          <div className="divide-y divide-hairline-soft">
            {order.tickets.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-sunken text-ink-3">
                    <Ticket className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-medium text-ink">{ticket.ticket_code}</p>
                    {ticket.seat_label && (
                      <p className="mt-0.5 text-xs text-ink-3">Seat {ticket.seat_label}</p>
                    )}
                  </div>
                </div>
                <Badge tone={ticket.status === "valid" ? "positive" : "neutral"} size="xs">
                  {ticket.status === "used" ? "Checked in" : ticket.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Refunds */}
      {order.refunds && order.refunds.length > 0 && (
        <Card className="mt-5 overflow-hidden">
          <div className="border-b border-hairline-soft px-4 py-3.5">
            <h2 className="text-base font-semibold text-ink">Refunds</h2>
          </div>
          <div className="divide-y divide-hairline-soft">
            {order.refunds.map((refund) => (
              <div key={refund.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <p className="text-ink">{formatMoney(refund.amount_cents, order.currency)}</p>
                  <p className="mt-0.5 text-xs text-ink-3">
                    {refund.reason ?? "No reason given"} · {formatDateTime(refund.created_at)}
                  </p>
                </div>
                <Badge tone={refund.status === "succeeded" ? "positive" : "caution"} size="xs">
                  {refund.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Action footer */}
      {order.event && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm" className="gap-1.5 text-ink-3">
            <Link href={`/events/${order.event.slug}`}>
              View event page <ArrowLeft className="size-3 rotate-180" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="size-3.5" />
            Download receipt
          </Button>
        </div>
      )}
    </div>
  );
}
