import { Shimmer } from "@/components/ui/skeleton";

/** See dashboard/[slug]/events/loading.tsx — exists to make this dynamic route prefetchable. */
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
      <Shimmer className="h-24 rounded-xl" />
    </div>
  );
}
