import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireOrganizer } from "@/lib/auth";
import { DashboardOrdersTable } from "@/components/dashboard/dashboard-orders-table";

export const metadata: Metadata = { title: "Orders" };

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
    <div className="space-y-6">
      <DashboardOrdersTable
        orders={(orders ?? []) as unknown as Parameters<typeof DashboardOrdersTable>[0]["orders"]}
        canRefund={canRefund}
        slug={slug}
      />
    </div>
  );
}
