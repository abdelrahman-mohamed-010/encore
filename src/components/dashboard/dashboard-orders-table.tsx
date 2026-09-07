"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/surface";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select";
import { TablePagination, TableRowsSkeleton, useTablePagination } from "@/components/ui/table";
import { RefundButton } from "@/components/dashboard/refund-button";
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

export type DashboardOrderItem = {
  id: string;
  order_number: string;
  status: OrderStatus;
  total_cents: number;
  refunded_cents: number;
  currency: string;
  created_at: string;
  buyer_name: string;
  buyer_email: string;
  payment_provider: string | null;
  event: { title: string } | null;
  tickets: unknown;
};

/** Static shell: search + status filter. Never a skeleton. */
export function DashboardOrdersShell({
  ordersPromise,
  canRefund,
}: {
  ordersPromise: PromiseLike<DashboardOrderItem[]>;
  canRefund: boolean;
}) {
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const columnCount = canRefund ? 7 : 6;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-56 max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by order #, buyer, or event..."
              className="pl-9"
              aria-label="Search orders"
            />
          </div>

          <SelectField
            value={statusFilter}
            onChange={setStatusFilter}
            aria-label="Filter orders by status"
            className="w-40"
            options={[
              { value: "all", label: "All statuses" },
              { value: "paid", label: "Paid" },
              { value: "pending", label: "Pending" },
              { value: "partially_refunded", label: "Partially refunded" },
              { value: "refunded", label: "Refunded" },
              { value: "cancelled", label: "Cancelled" },
              { value: "failed", label: "Failed" },
            ]}
          />
        </div>
      </div>

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
          <React.Suspense fallback={<TableRowsSkeleton rows={6} columns={columnCount} />}>
            <OrderRows ordersPromise={ordersPromise} query={query} statusFilter={statusFilter} canRefund={canRefund} />
          </React.Suspense>
        </table>
      </Card>
    </div>
  );
}

function OrderRows({
  ordersPromise,
  query,
  statusFilter,
  canRefund,
}: {
  ordersPromise: PromiseLike<DashboardOrderItem[]>;
  query: string;
  statusFilter: string;
  canRefund: boolean;
}) {
  const orders = React.use(ordersPromise);
  const columnCount = canRefund ? 7 : 6;

  const filteredOrders = React.useMemo(() => {
    return orders.filter((order) => {
      const q = query.toLowerCase().trim();
      const matchesQuery =
        !q ||
        order.order_number.toLowerCase().includes(q) ||
        order.buyer_name.toLowerCase().includes(q) ||
        order.buyer_email.toLowerCase().includes(q) ||
        (order.event?.title && order.event.title.toLowerCase().includes(q));

      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [orders, query, statusFilter]);

  const {
    paginatedItems,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    setPage,
    setPageSize,
  } = useTablePagination(filteredOrders, 10);

  if (filteredOrders.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={columnCount} className="px-4 py-16 text-center">
            <p className="text-sm font-medium text-ink">No orders found</p>
            <p className="mt-1 text-sm text-ink-3">
              {orders.length === 0
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
        {paginatedItems.map((order) => {
          const count = (order.tickets as unknown as { count: number }[])?.[0]?.count ?? 0;

          return (
            <tr
              key={order.id}
              className="border-b border-hairline-soft last:border-b-0 hover:bg-sunken transition-colors"
            >
              <td className="px-4 py-3">
                <span className="font-mono text-xs font-semibold text-ink">
                  {order.order_number}
                </span>
                <span className="ml-2 text-xs text-ink-3">
                  {count} {count === 1 ? "ticket" : "tickets"}
                </span>
              </td>

              <td className="px-4 py-3">
                <p className="truncate font-medium text-ink">{order.buyer_name}</p>
                <p className="truncate text-xs text-ink-3">{order.buyer_email}</p>
              </td>

              <td className="max-w-48 truncate px-4 py-3 text-ink-2">
                {order.event?.title ?? "—"}
              </td>

              <td className="whitespace-nowrap px-4 py-3 text-ink-3">
                {formatDateTime(order.created_at)}
              </td>

              <td className="whitespace-nowrap px-4 py-3 text-right tabular font-medium text-ink">
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
      <tfoot>
        <tr>
          <td colSpan={columnCount} className="p-0">
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </td>
        </tr>
      </tfoot>
    </>
  );
}
