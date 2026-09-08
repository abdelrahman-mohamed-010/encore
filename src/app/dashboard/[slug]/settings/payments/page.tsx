import { Suspense } from "react";
import type { Metadata } from "next";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireOrganizer } from "@/lib/auth";
import { isStripeConnectConfigured } from "@/lib/payments/stripe";
import { Card, CardBody } from "@/components/ui/surface";
import { Shimmer } from "@/components/ui/skeleton";
import { StripeStatusCard } from "./stripe-status-card";

export const metadata: Metadata = { title: "Payments" };

export default async function PaymentsSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const { slug } = await params;
  const { connected, error } = await searchParams;
  const { organizer } = await requireOrganizer(slug, "admin");
  const supabase = await createClient();

  // Not awaited: the heading and the status card below stream in
  // independently, so the page never blocks on this one lookup.
  const accountPromise = supabase
    .from("payment_accounts")
    .select("*")
    .eq("organizer_id", organizer.id)
    .maybeSingle()
    .then(({ data }) => data);

  const connectConfigured = isStripeConnectConfigured();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-ink">Payouts & Stripe</h2>
        <p className="mt-1 text-sm text-ink-3">
          Connect your own Stripe account. Ticket money goes straight to you; Encore takes only its service fee as an application fee on each charge.
        </p>
      </div>

      {connected === "1" && (
        <div className="flex items-start gap-2.5 rounded-xl border border-transparent bg-positive-bg px-4 py-3 text-sm text-positive">
          <CheckCircle2 className="mt-px size-4 shrink-0" />
          Stripe connected. If charges are still disabled, finish the remaining steps in Stripe.
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-transparent bg-critical-bg px-4 py-3 text-sm text-critical">
          <AlertTriangle className="mt-px size-4 shrink-0" />
          {decodeURIComponent(error)}
        </div>
      )}

      <Suspense fallback={<Shimmer className="h-64 rounded-xl" />}>
        <StripeStatusCard
          accountPromise={accountPromise}
          organizerId={organizer.id}
          connectConfigured={connectConfigured}
        />
      </Suspense>

      <Card inset className="p-4">
        <p className="text-sm font-medium text-ink">How the money splits</p>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-2">
          Each charge is created on your connected account with Encore&apos;s service fee as the
          Stripe <span className="font-mono text-xs">application_fee_amount</span>. You are the
          merchant of record, payouts follow your Stripe schedule, and refunds pull the platform fee
          back proportionally.
        </p>
      </Card>
    </div>
  );
}
