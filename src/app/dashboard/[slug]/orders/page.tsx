import Link from "next/link";
import type { Metadata } from "next";
import { Receipt } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireOrganizer } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/surface";

import { EmptyState } from "@/components/ui/misc";
import { RefundButton } from "@/components/dashboard/refund-button";
import { formatDateTime, formatMoney } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";
import { DashboardBody, DashboardHeader } from "@/components/dashboard/page-header";

export const metadata: Metadata = { title: "Orders" };

const TONE: Record<OrderStatus, "positive" | "caution" | "critical" | "neutral"> = {
  paid: "positive",
  pending: "caution",
  failed: "critical",
  cancelled: "neutral",
  refunded: "critical",
  partially_refunded: "caution",
};

export default async function DashboardOrdersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organizer, role } = await requireOrganizer(slug, "staff");
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select(
      `id, order_number, status, total_cents, refunded_cents, currency, created_at,
       buyer_name, buyer_email, payment_provider,
       event:events(title),
       tickets:tickets(count)`,
    )
    .eq("organizer_id", organizer.id)
    .order("created_at", { ascending: false })
    .limit(200);

  const canRefund = role === "owner" || role === "admin";

  return (
    <>
      <DashboardHeader title="Orders" description="Every purchase across your events." />

      <DashboardBody className="space-y-6">

      {!orders || orders.length === 0 ? (
        <EmptyState icon={Receipt} title="No orders yet" description="Sales will appear here as they happen." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead>
              <tr className="border-b border-hairline text-2xs uppercase tracking-[0.06em] text-ink-3">
                <th scope="col" className="px-4 py-3 font-semibold">Order</th>
                <th scope="col" className="px-4 py-3 font-semibold">Buyer</th>
                <th scope="col" className="px-4 py-3 font-semibold">Event</th>
                <th scope="col" className="px-4 py-3 font-semibold">Date</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Total</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                {canRefund && <th scope="col" className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const count = (order.tickets as unknown as { count: number }[])?.[0]?.count ?? 0;
                return (
                  <tr key={order.id} className="border-b border-hairline-soft last:border-b-0 hover:bg-sunken">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-ink">{order.order_number}</span>
                      <span className="ml-2 text-xs text-ink-3">
                        {count} {count === 1 ? "ticket" : "tickets"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="truncate text-ink">{order.buyer_name}</p>
                      <p className="truncate text-xs text-ink-3">{order.buyer_email}</p>
                    </td>
                    <td className="max-w-48 truncate px-4 py-3 text-ink-2">{order.event?.title}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-3">
                      {formatDateTime(order.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular text-ink">
                      {formatMoney(order.total_cents, order.currency)}
                      {order.refunded_cents > 0 && (
                        <span className="block text-2xs text-critical">
                          −{formatMoney(order.refunded_cents, order.currency)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={TONE[order.status]} size="xs">
                        {order.status.replace("_", " ")}
                      </Badge>
                    </td>
                    {canRefund && (
                      <td className="px-4 py-3 text-right">
                        {(order.status === "paid" || order.status === "partially_refunded") && (
                          <RefundButton
                            orderId={order.id}
                            orderNumber={order.order_number}
                            maxCents={order.total_cents - order.refunded_cents}
                            currency={order.currency}
                          />
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <p className="text-xs text-ink-3">
        Showing the 200 most recent orders.{" "}
        <Link href={`/dashboard/${slug}/attendees`} className="underline underline-offset-4">
          See attendees
        </Link>{" "}
        for a per-ticket view.
      </p>
      </DashboardBody>
    </>
);
}
