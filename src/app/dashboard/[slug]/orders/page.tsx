import type { Metadata } from "next";
import { requireOrganizer } from "@/lib/auth";
import { DashboardOrdersShell } from "@/features/dashboard/components/dashboard-orders-table";
import { OrdersRows } from "@/features/dashboard/components/dashboard-orders-rows";

export const metadata: Metadata = { title: "Orders" };

const PAGE_SIZE = 10;

export default async function DashboardOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { slug } = await params;
  const { q, status, page: pageParam } = await searchParams;
  const { organizer, role } = await requireOrganizer(slug, "staff");
  const page = Math.max(1, Number(pageParam) || 1);
  const canRefund = role === "owner" || role === "admin";

  return (
    <div className="space-y-6">
      <DashboardOrdersShell canRefund={canRefund}>
        <OrdersRows
          organizerId={organizer.id}
          canRefund={canRefund}
          query={q}
          status={status}
          page={page}
          pageSize={PAGE_SIZE}
        />
      </DashboardOrdersShell>
    </div>
  );
}
