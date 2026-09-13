import { Receipt } from "lucide-react";
import { OrderStatusBadge } from "@/components/ui/status-badge";
import { PaginationRow, TableEmptyRow } from "@/components/ui/table";
import { RefundButton } from "@/features/dashboard/components/refund-button";
import { listOrganizerOrders } from "@/features/dashboard/queries";
import { formatDateTime, formatMoney } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

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

  const {
    rows: orders,
    total,
    totalPages,
  } = await listOrganizerOrders({ organizerId, query, status, page, pageSize });

  if (orders.length === 0) {
    return (
      <TableEmptyRow
        icon={Receipt}
        columns={columnCount}
        title="No orders found"
        description={
          total === 0 && !query && (!status || status === "all")
            ? "Sales and registrations will appear here as they happen."
            : "Try adjusting your search or status filter."
        }
      />
    );
  }

  return (
    <>
      <tbody>
        {orders.map((order) => {
          const count = order.ticketCount;

          return (
            <tr
              key={order.id}
              className="border-b border-hairline-soft last:border-b-0 hover:bg-sunken transition-colors"
            >
              <td data-cell="primary" className="px-5 py-3.5">
                <span className="font-mono text-xs font-semibold text-ink">{order.order_number}</span>
                <span className="ml-2 text-xs text-ink-3">
                  {count} {count === 1 ? "ticket" : "tickets"}
                </span>
              </td>

              <td data-label="Buyer" className="px-5 py-3.5">
                <p className="truncate font-medium text-ink">{order.buyer_name}</p>
                <p className="truncate text-xs text-ink-3">{order.buyer_email}</p>
              </td>

              <td data-label="Event" className="max-w-48 truncate px-5 py-3.5 text-ink-2">{order.event?.title ?? "—"}</td>

              <td data-label="Date" className="whitespace-nowrap px-5 py-3.5 text-ink-3">
                {formatDateTime(order.created_at)}
              </td>

              <td data-label="Total" className="whitespace-nowrap px-5 py-3.5 text-right tabular font-medium text-ink">
                {formatMoney(order.total_cents, order.currency)}
                {order.refunded_cents > 0 && (
                  <span className="block text-2xs text-critical">
                    −{formatMoney(order.refunded_cents, order.currency)}
                  </span>
                )}
              </td>

              <td data-label="Status" className="px-5 py-3.5">
                <OrderStatusBadge status={order.status} size="xs" />
              </td>

              {canRefund && (
                <td data-cell="actions" className="px-5 py-3.5 text-right">
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
