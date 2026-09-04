"use client";

import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAsyncAction, useTicketSelection } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/surface";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/format";
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
  const selection = useTicketSelection(availability);
  const currency = availability[0]?.currency ?? "USD";

  const reserve = useAsyncAction(async () => {
    if (!signedIn) {
      router.push(`/auth/login?next=${encodeURIComponent(`/events/${eventId}`)}`);
      return;
    }
    if (selection.lines.length === 0) {
      toast.error("Choose at least one ticket");
      return;
    }

    const { data, error } = await createClient().rpc("create_reservation", {
      p_event_id: eventId,
      p_items: selection.lines,
      p_seat_ids: [],
    });

    if (error) {
      // Someone else may have taken the last ticket while this page was open.
      toast.error("Could not hold those tickets", { description: error.message });
      selection.clear();
      router.refresh();
      return;
    }

    const reservation = data as { reservation_id: string };
    router.push(`/checkout/${reservation.reservation_id}`);
  });

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
          const qty = selection.quantities[tier.ticket_type_id] ?? 0;
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
                  onClick={() => selection.step(tier, -1)}
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
                  onClick={() => selection.step(tier, 1)}
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
            {selection.count > 0
              ? `${selection.count} ${selection.count === 1 ? "ticket" : "tickets"}`
              : "No tickets selected"}
          </p>
          <p className="text-[18px] font-semibold tabular text-ink">
            {formatMoney(selection.subtotalCents, currency)}
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          loading={reserve.pending}
          disabled={selection.count === 0}
          onClick={() => reserve.run()}
        >
          {signedIn ? "Get tickets" : "Sign in to book"}
        </Button>
      </div>

      <p className="text-center text-[12px] text-ink-3">
        Tickets are held for 10 minutes while you check out.
      </p>
    </div>
  );
}
