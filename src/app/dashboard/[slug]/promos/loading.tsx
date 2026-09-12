"use client";

import { PromoShell } from "@/components/dashboard/promo-manager";
import { Shimmer } from "@/components/ui/skeleton";

/** See events/loading.tsx — exists to make this dynamic route prefetchable. */
export default function Loading() {
  return (
    <PromoShell organizerSlug="" events={[]}>
      <div className="overflow-hidden rounded-xl bg-card">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border-b border-hairline-soft px-5 py-3.5 last:border-b-0">
            <Shimmer className="h-11 rounded-lg" />
          </div>
        ))}
      </div>
    </PromoShell>
  );
}
