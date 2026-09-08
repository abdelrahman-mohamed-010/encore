import { Badge } from "@/components/ui/badge";
import { PaginationRow } from "@/components/ui/table";
import { RefundButton } from "@/components/dashboard/refund-button";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, formatMoney } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

const TONE: Record<OrderStatus, "positive" | "caution" | "critical" | "neutral"> = {
  paid: "positive",
  pending: "caution",
  failed: "critical",
  cancelled: "neutral",
  refunded: "critical",
  partially_refunded: "caution",
};

export async function OrdersRows({
  organizerId,
  canRefund,
  query,
  status,
  page,
  pageSize,
}: {
  organizerId: string;
  canRefund: boolean;
  query?: string;
  status?: string;
  page: number;
  pageSize: number;
}) {
  const columnCount = canRefund ? 7 : 6;
  const supabase = await createClient();

  let dbQuery = supabase
    .from("orders")
    .select(
      `id, order_number, status, total_cents, refunded_cents, currency, created_at,
       buyer_name, buyer_email, payment_provider,
       event:events(title),
       tickets:tickets(count)`,
      { count: "exact" },
    )
    .eq("organizer_id", organizerId);

  if (status && status !== "all") dbQuery = dbQuery.eq("status", status as OrderStatus);
  if (query?.trim()) {
    const term = `%${query.trim()}%`;
    dbQuery = dbQuery.or(`order_number.ilike.${term},buyer_name.ilike.${term},buyer_email.ilike.${term}`);
  }

  const from = (page - 1) * pageSize;
  const { data, count } = await dbQuery
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  const orders = (data ?? []) as unknown as {
    id: string;
    order_number: string;
    status: OrderStatus;
    total_cents: number;
    refunded_cents: number;
    currency: string;
    created_at: string;
    buyer_name: string;
    buyer_email: string;
    event: { title: string } | null;
    tickets: unknown;
  }[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (orders.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={columnCount} className="px-5 py-16 text-center">
            <p className="text-sm font-medium text-ink">No orders found</p>
            <p className="mt-1 text-sm text-ink-3">
              {total === 0 && !query && (!status || status === "all")
                ? "Sales and registrations will appear here as they happen."
                : "Try adjusting your search or status filter."}
            </p>
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <>
      <tbody>
        {orders.map((order) => {
          const count = (order.tickets as unknown as { count: number }[])?.[0]?.count ?? 0;

          return (
            <tr
              key={order.id}
              className="border-b border-hairline-soft last:border-b-0 hover:bg-sunken transition-colors"
            >
              <td className="px-5 py-3.5">
                <span className="font-mono text-xs font-semibold text-ink">{order.order_number}</span>
                <span className="ml-2 text-xs text-ink-3">
                  {count} {count === 1 ? "ticket" : "tickets"}
                </span>
              </td>

              <td className="px-5 py-3.5">
                <p className="truncate font-medium text-ink">{order.buyer_name}</p>
                <p className="truncate text-xs text-ink-3">{order.buyer_email}</p>
              </td>

              <td className="max-w-48 truncate px-5 py-3.5 text-ink-2">{order.event?.title ?? "—"}</td>

              <td className="whitespace-nowrap px-5 py-3.5 text-ink-3">
                {formatDateTime(order.created_at)}
              </td>

              <td className="whitespace-nowrap px-5 py-3.5 text-right tabular font-medium text-ink">
                {formatMoney(order.total_cents, order.currency)}
                {order.refunded_cents > 0 && (
                  <span className="block text-2xs text-critical">
                    −{formatMoney(order.refunded_cents, order.currency)}
                  </span>
                )}
              </td>

              <td className="px-5 py-3.5">
                <Badge tone={TONE[order.status]} size="xs">
                  {order.status.replace("_", " ")}
                </Badge>
              </td>

              {canRefund && (
                <td className="px-5 py-3.5 text-right">
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
      <tfoot>
        <tr>
          <td colSpan={columnCount} className="p-0">
            <PaginationRow page={page} totalPages={totalPages} total={total} pageSize={pageSize} />
          </td>
        </tr>
      </tfoot>
    </>
  );
}
