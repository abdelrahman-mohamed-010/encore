"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/surface";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/format";
import { stepQuantity } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { TicketAvailability } from "@/lib/types";

export function TicketPicker({
  eventId,
  availability,
  signedIn,
}: {
  eventId: string;
  availability: TicketAvailability[];
  signedIn: boolean;
}) {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [pending, startTransition] = useTransition();

  const currency = availability[0]?.currency ?? "USD";
  const { subtotal, count } = useMemo(() => {
    let subtotal = 0;
    let count = 0;
    for (const tier of availability) {
      const qty = quantities[tier.ticket_type_id] ?? 0;
      subtotal += qty * tier.price_cents;
      count += qty;
    }
    return { subtotal, count };
  }, [quantities, availability]);

  function adjust(tier: TicketAvailability, delta: number) {
    setQuantities((prev) => ({
      ...prev,
      [tier.ticket_type_id]: stepQuantity(prev[tier.ticket_type_id] ?? 0, delta, {
        minPerOrder: tier.min_per_order,
        maxPerOrder: tier.max_per_order,
        available: tier.available,
      }),
    }));
  }

  function reserve() {
    if (!signedIn) {
      router.push(`/auth/login?next=${encodeURIComponent(`/events?reserve=${eventId}`)}`);
      return;
    }

    const items = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([ticket_type_id, quantity]) => ({ ticket_type_id, quantity }));

    if (items.length === 0) {
      toast.error("Choose at least one ticket");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("create_reservation", {
        p_event_id: eventId,
        p_items: items,
        p_seat_ids: [],
      });

      if (error) {
        toast.error("Could not hold those tickets", { description: error.message });
        router.refresh();
        return;
      }

      const reservation = data as { reservation_id: string };
      router.push(`/checkout/${reservation.reservation_id}`);
    });
  }

  if (availability.length === 0) {
    return (
      <Card inset className="p-5 text-center">
        <p className="text-[14px] font-medium text-ink">Tickets are not on sale yet</p>
        <p className="mt-1 text-[13px] text-ink-3">Check back soon or follow the organizer.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        {availability.map((tier) => {
          const qty = quantities[tier.ticket_type_id] ?? 0;
          const soldOut = tier.available <= 0;
          const disabled = soldOut || !tier.on_sale;
          const ceiling = Math.min(tier.max_per_order, tier.available);

          return (
            <div
              key={tier.ticket_type_id}
              className={cn(
                "flex items-center gap-4 border-b border-hairline-soft px-4 py-4 last:border-b-0",
                disabled && "opacity-55",
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[14.5px] font-medium text-ink">{tier.name}</p>
                  {soldOut && <Badge tone="critical" size="xs">Sold out</Badge>}
                  {!soldOut && !tier.on_sale && <Badge tone="caution" size="xs">Not on sale</Badge>}
                  {!soldOut && tier.available <= 10 && tier.on_sale && (
                    <Badge tone="caution" size="xs">{tier.available} left</Badge>
                  )}
                </div>
                <p className="mt-1 text-[13px] text-ink-3">
                  {tier.price_cents === 0 ? "Free" : formatMoney(tier.price_cents, tier.currency)}
                  {tier.min_per_order > 1 && ` · minimum ${tier.min_per_order}`}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label={`Remove one ${tier.name}`}
                  disabled={disabled || qty === 0}
                  onClick={() => adjust(tier, -1)}
                >
                  <Minus />
                </Button>
                <span className="w-8 text-center text-[14px] font-semibold tabular text-ink">
                  {qty}
                </span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label={`Add one ${tier.name}`}
                  disabled={disabled || qty >= ceiling}
                  onClick={() => adjust(tier, 1)}
                >
                  <Plus />
                </Button>
              </div>
            </div>
          );
        })}
      </Card>

      <div className="flex items-center justify-between gap-4 rounded-xl border border-hairline bg-card px-4 py-3.5">
        <div>
          <p className="text-[12.5px] text-ink-3">
            {count > 0 ? `${count} ${count === 1 ? "ticket" : "tickets"}` : "No tickets selected"}
          </p>
          <p className="text-[18px] font-semibold tabular text-ink">
            {formatMoney(subtotal, currency)}
          </p>
        </div>
        <Button variant="solid" size="lg" loading={pending} disabled={count === 0} onClick={reserve}>
          {signedIn ? "Get tickets" : "Sign in to book"}
        </Button>
      </div>

      <p className="text-center text-[12px] text-ink-3">
        Tickets are held for 10 minutes while you check out.
      </p>
    </div>
  );
}
