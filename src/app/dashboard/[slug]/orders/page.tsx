import { Suspense } from "react";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireOrganizer } from "@/lib/auth";
import { SkeletonRows } from "@/components/ui/skeleton";
import { DashboardOrdersTable } from "@/components/dashboard/dashboard-orders-table";

export const metadata: Metadata = { title: "Orders" };

export default async function DashboardOrdersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Membership decides whether this page may render at all, so it is awaited
  // here. The orders themselves stream in behind their own boundary.
  const { organizer, role } = await requireOrganizer(slug, "staff");
  const canRefund = role === "owner" || role === "admin";

  return (
    <div className="space-y-6">
      <Suspense fallback={<SkeletonRows rows={10} />}>
        <Orders organizerId={organizer.id} canRefund={canRefund} slug={slug} />
      </Suspense>
    </div>
  );
}

async function Orders({
  organizerId,
  canRefund,
  slug,
}: {
  organizerId: string;
  canRefund: boolean;
  slug: string;
}) {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select(
      `id, order_number, status, total_cents, refunded_cents, currency, created_at,
       buyer_name, buyer_email, payment_provider,
       event:events(title),
       tickets:tickets(count)`,
    )
    .eq("organizer_id", organizerId)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <DashboardOrdersTable
      orders={(orders ?? []) as unknown as Parameters<typeof DashboardOrdersTable>[0]["orders"]}
      canRefund={canRefund}
      slug={slug}
    />
  );
}
