"use client";

import { useCallback, useMemo, useState } from "react";

export type SelectableSeat = {
  id: string;
  status: string;
  price_cents: number | null;
  ticket_type_id: string | null;
};

/**
 * Reserved-seating selection, capped so one buyer cannot lock a whole row.
 * Returns why a toggle was refused so the caller can explain it to the buyer
 * rather than silently doing nothing.
 */
export function useSeatSelection(
  seats: SelectableSeat[],
  priceFor: (seat: SelectableSeat) => number,
  maxSeats = 8,
) {
  const [selected, setSelected] = useState<string[]>([]);
  const byId = useMemo(() => new Map(seats.map((seat) => [seat.id, seat])), [seats]);

  const toggle = useCallback(
    (seatId: string): { ok: true } | { ok: false; reason: string } => {
      const seat = byId.get(seatId);
      if (!seat) return { ok: false, reason: "That seat is not part of this event." };
      if (seat.status !== "available") return { ok: false, reason: "That seat is taken." };

      if (selected.includes(seatId)) {
        setSelected((prev) => prev.filter((id) => id !== seatId));
        return { ok: true };
      }
      if (selected.length >= maxSeats) {
        return { ok: false, reason: `You can pick up to ${maxSeats} seats at once.` };
      }
      setSelected((prev) => [...prev, seatId]);
      return { ok: true };
    },
    [byId, selected, maxSeats],
  );

  const subtotalCents = useMemo(
    () =>
      selected.reduce((sum, id) => {
        const seat = byId.get(id);
        return sum + (seat ? priceFor(seat) : 0);
      }, 0),
    [selected, byId, priceFor],
  );

  return {
    selected,
    subtotalCents,
    count: selected.length,
    isSelected: (id: string) => selected.includes(id),
    toggle,
    clear: () => setSelected([]),
  };
}
