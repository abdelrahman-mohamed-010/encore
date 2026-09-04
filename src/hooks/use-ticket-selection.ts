"use client";

import { useMemo, useReducer } from "react";
import { stepQuantity } from "@/lib/pricing";
import type { TicketAvailability } from "@/lib/types";

type Action =
  | { type: "step"; ticketTypeId: string; delta: number; tier: TicketAvailability }
  | { type: "clear" };

function reducer(state: Record<string, number>, action: Action): Record<string, number> {
  switch (action.type) {
    case "step": {
      const next = stepQuantity(state[action.ticketTypeId] ?? 0, action.delta, {
        minPerOrder: action.tier.min_per_order,
        maxPerOrder: action.tier.max_per_order,
        available: action.tier.available,
      });
      return { ...state, [action.ticketTypeId]: next };
    }
    case "clear":
      return {};
  }
}

/**
 * General-admission ticket selection. A reducer rather than a bag of useState
 * calls: quantity changes are a single well-defined transition, and the derived
 * totals are computed rather than stored, so they can never fall out of sync.
 */
export function useTicketSelection(tiers: TicketAvailability[]) {
  const [quantities, dispatch] = useReducer(reducer, {});

  const { subtotalCents, count, lines } = useMemo(() => {
    let subtotalCents = 0;
    let count = 0;
    const lines: { ticket_type_id: string; quantity: number }[] = [];

    for (const tier of tiers) {
      const quantity = quantities[tier.ticket_type_id] ?? 0;
      if (quantity <= 0) continue;
      subtotalCents += quantity * tier.price_cents;
      count += quantity;
      lines.push({ ticket_type_id: tier.ticket_type_id, quantity });
    }
    return { subtotalCents, count, lines };
  }, [quantities, tiers]);

  return {
    quantities,
    subtotalCents,
    count,
    lines,
    step: (tier: TicketAvailability, delta: number) =>
      dispatch({ type: "step", ticketTypeId: tier.ticket_type_id, delta, tier }),
    clear: () => dispatch({ type: "clear" }),
  };
}
