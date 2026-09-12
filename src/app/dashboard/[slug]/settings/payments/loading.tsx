import { Card } from "@/components/ui/surface";
import { Shimmer } from "@/components/ui/skeleton";

/** Mirrors page.tsx: only the account-dependent status card shimmers — the
 *  heading and the static "how the split works" card need no fetch at all. */
export default function Loading() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-ink">Payouts & Stripe</h2>
        <p className="mt-1 text-sm text-ink-3">
          Connect your own Stripe account. Ticket money goes straight to you; Encore takes only its service fee as an application fee on each charge.
        </p>
      </div>

      <Shimmer className="h-64 rounded-xl" />

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
