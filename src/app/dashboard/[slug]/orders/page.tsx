import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireOrganizer } from "@/lib/auth";
import { DashboardOrdersShell, type DashboardOrderItem } from "@/components/dashboard/dashboard-orders-table";

export const metadata: Metadata = { title: "Orders" };

export default async function DashboardOrdersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organizer, role } = await requireOrganizer(slug, "staff");
  const supabase = await createClient();

  const ordersPromise = supabase
    .from("orders")
    .select(
      `id, order_number, status, total_cents, refunded_cents, currency, created_at,
       buyer_name, buyer_email, payment_provider,
       event:events(title),
       tickets:tickets(count)`,
    )
    .eq("organizer_id", organizer.id)
    .order("created_at", { ascending: false })
    .limit(200)
    .then(({ data }) => (data ?? []) as unknown as DashboardOrderItem[]);

  const canRefund = role === "owner" || role === "admin";

  return (
    <div className="space-y-6">
      <DashboardOrdersShell ordersPromise={ordersPromise} canRefund={canRefund} />
    </div>
  );
}
