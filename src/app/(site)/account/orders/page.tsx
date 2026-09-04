import Link from "next/link";
import type { Metadata } from "next";
import { Receipt } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { formatDate, formatMoney, pluralize } from "@/lib/format";
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
       event:events(title, slug),
       tickets:tickets(count)`,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (!orders || orders.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No orders yet"
        description="Your purchase history will show up here."
        action={
          <Button asChild variant="solid" size="md">
            <Link href="/events">Browse events</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-e1">
      {orders.map((order) => {
        const ticketCount = (order.tickets as unknown as { count: number }[])?.[0]?.count ?? 0;
        return (
          <Link
            key={order.id}
            href={`/account/orders/${order.id}`}
            className="flex items-center gap-4 border-b border-hairline-soft px-4 py-4 transition-colors last:border-b-0 hover:bg-sunken"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-base font-semibold text-ink">
                  {order.event?.title ?? "Event"}
                </p>
                <Badge tone={TONE[order.status]} size="xs">
                  {order.status.replace("_", " ")}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-ink-3">
                <span className="font-mono">{order.order_number}</span>
                {" · "}
                {formatDate(order.created_at, "medium")}
                {ticketCount > 0 && ` · ${pluralize(ticketCount, "ticket")}`}
              </p>
            </div>
            <span className="shrink-0 text-base font-semibold tabular text-ink">
              {formatMoney(order.total_cents, order.currency)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
