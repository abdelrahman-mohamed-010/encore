import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { isStripeConfigured } from "@/lib/payments";
import { CompleteClient } from "./complete-client";

export const metadata: Metadata = { title: "Complete your payment" };

export default async function CheckoutCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; redirect_status?: string }>;
}) {
  const { order: orderId, redirect_status: redirectStatus } = await searchParams;
  if (!orderId) redirect("/events");

  const user = await requireUser();
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, user_id, status, total_cents, currency, order_number, payment_provider")
    .eq("id", orderId)
    .maybeSingle();

  if (!order || order.user_id !== user.id) redirect("/account/orders");
  if (order.status === "paid") redirect(`/account/orders/${order.id}?celebrate=1`);
  if (order.status !== "pending") redirect(`/account/orders/${order.id}`);

  if (order.payment_provider !== "stripe" || !isStripeConfigured()) {
    redirect(`/checkout/${order.id}`);
  }

  return (
    <CompleteClient
      orderId={order.id}
      orderNumber={order.order_number}
      totalCents={order.total_cents}
      currency={order.currency}
      returningFromRedirect={redirectStatus === "succeeded"}
    />
  );
}
