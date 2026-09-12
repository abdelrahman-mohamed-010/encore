import Link from "next/link";
import { Plus, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/surface";

import { EmptyState } from "@/components/ui/empty-state";import { PaginationRow } from "@/components/ui/table";
import { listPromos } from "@/features/promos/queries";
import { formatMoney, formatNumber } from "@/lib/format";
import { PromoRowActions } from "@/features/promos/components/promo-row-actions";

export async function PromoRows({
  organizerId,
  organizerSlug,
  query,
  page,
  pageSize,
}: {
  organizerId: string;
  organizerSlug: string;
  query?: string;
  page: number;
  pageSize: number;
}) {
  const { promos, total, totalPages } = await listPromos({ organizerId, query, page, pageSize });

  if (promos.length === 0) {
    return (
      <EmptyState
        icon={Tag}
        title={total === 0 && !query ? "No promo codes yet" : "No matching codes found"}
        description={
          total === 0 && !query
            ? "Create a code to run a presale, a partner discount or a friends-and-family rate."
            : "Try adjusting your search query."
        }
        action={
          total === 0 && !query ? (
            <Button asChild variant="solid" size="md">
              <Link href="?new=1">
                <Plus /> New code
              </Link>
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <Card className="overflow-hidden">
      {promos.map((promo) => (
        <div
          key={promo.id}
          className="flex items-center gap-4 border-b border-hairline-soft px-5 py-3.5 last:border-b-0"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-base font-semibold text-ink">{promo.code}</span>
            </div>
            <p className="mt-1 text-xs text-ink-3">
              {promo.discount_type === "percentage"
                ? `${promo.discount_value}% off`
                : `${formatMoney(Number(promo.discount_value))} off`}
              {promo.min_order_cents > 0 && ` · min ${formatMoney(promo.min_order_cents)}`}
              {" · "}
              {formatNumber(promo.times_redeemed)} used
              {promo.max_redemptions ? ` of ${formatNumber(promo.max_redemptions)}` : ""}
            </p>
          </div>

          <PromoRowActions
            id={promo.id}
            code={promo.code}
            isActive={promo.is_active}
            organizerSlug={organizerSlug}
          />
        </div>
      ))}

      {totalPages > 1 && <PaginationRow page={page} totalPages={totalPages} total={total} pageSize={pageSize} />}
    </Card>
  );
}
