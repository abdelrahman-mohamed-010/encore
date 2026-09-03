import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, CalendarDays, MapPin, Receipt } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, Divider } from "@/components/ui/surface";
import { FieldRow } from "@/components/ui/field-row";
import { SummaryLine } from "@/components/ui/misc";
import { OrderCelebration } from "./celebration";
import { formatDateTime, formatEventStamp, formatMoney } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Order" };

const TONE: Record<OrderStatus, "positive" | "caution" | "critical" | "neutral"> = {
  paid: "positive",
  pending: "caution",
  failed: "critical",
  cancelled: "neutral",
  refunded: "critical",
  partially_refunded: "caution",
};

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
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      `*,
       event:events(title, slug, starts_at, timezone, is_online, venue:venues(name, city, country)),
       items:order_items(id, ticket_type_name, seat_label, quantity, unit_price_cents, subtotal_cents),
       tickets:tickets(id, ticket_code, status, seat_label),
       refunds:refunds(id, amount_cents, reason, status, created_at)`,
    )
    .eq("id", orderId)
    .maybeSingle();

  if (!order || order.user_id !== user.id) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      {celebrate === "1" && order.status === "paid" && <OrderCelebration />}

      <Link
        href="/account/orders"
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-ink-3 transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" />
        All orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="display-3 text-ink">{order.event?.title}</h1>
          <p className="mt-1.5 font-mono text-[13px] text-ink-3">{order.order_number}</p>
        </div>
        <Badge tone={TONE[order.status]} size="md">
          {order.status.replace("_", " ")}
        </Badge>
      </div>

      <Card className="mt-6 overflow-hidden">
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

      <Card className="mt-5 overflow-hidden">
        <div className="border-b border-hairline-soft px-4 py-3.5">
          <h2 className="text-[14px] font-semibold text-ink">Items</h2>
        </div>
        <div className="space-y-3 p-4">
          {order.items?.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3 text-[13.5px]">
              <div className="min-w-0">
                <p className="text-ink">
                  {item.quantity} × {item.ticket_type_name}
                </p>
                {item.seat_label && (
                  <p className="mt-0.5 text-[12px] text-ink-3">{item.seat_label}</p>
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

      {order.tickets && order.tickets.length > 0 && (
        <Card className="mt-5 overflow-hidden">
          <div className="flex items-center justify-between border-b border-hairline-soft px-4 py-3.5">
            <h2 className="text-[14px] font-semibold text-ink">
              Tickets ({order.tickets.length})
            </h2>
            <Button asChild variant="outline" size="sm">
              <Link href="/account/tickets">Open tickets</Link>
            </Button>
          </div>
          <div className="divide-y divide-hairline-soft">
            {order.tickets.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-mono text-[13px] font-medium text-ink">{ticket.ticket_code}</p>
                  {ticket.seat_label && (
                    <p className="mt-0.5 text-[12px] text-ink-3">{ticket.seat_label}</p>
                  )}
                </div>
                <Badge tone={ticket.status === "valid" ? "positive" : "neutral"} size="xs">
                  {ticket.status === "used" ? "Checked in" : ticket.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {order.refunds && order.refunds.length > 0 && (
        <Card className="mt-5 overflow-hidden">
          <div className="border-b border-hairline-soft px-4 py-3.5">
            <h2 className="text-[14px] font-semibold text-ink">Refunds</h2>
          </div>
          <div className="divide-y divide-hairline-soft">
            {order.refunds.map((refund) => (
              <div key={refund.id} className="flex items-center justify-between gap-3 px-4 py-3 text-[13px]">
                <div>
                  <p className="text-ink">{formatMoney(refund.amount_cents, order.currency)}</p>
                  <p className="mt-0.5 text-[12px] text-ink-3">
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
    </div>
  );
}
