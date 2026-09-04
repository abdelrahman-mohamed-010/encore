"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAsyncAction, useSeatSelection } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/surface";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TicketAvailability } from "@/lib/types";

type SeatNode = {
  id: string;
  status: string;
  price_cents: number | null;
  ticket_type_id: string | null;
  seat: {
    id: string;
    row_label: string;
    seat_number: string;
    pos_x: number;
    pos_y: number;
    section: { id: string; name: string; code: string; color: string } | null;
  } | null;
};

const MAX_SEATS = 8;

export function SeatMap({
  eventId,
  seats,
  availability,
  signedIn,
}: {
  eventId: string;
  seats: SeatNode[];
  availability: TicketAvailability[];
  signedIn: boolean;
}) {
  const router = useRouter();

  const priceByType = useMemo(
    () => new Map(availability.map((tier) => [tier.ticket_type_id, tier])),
    [availability],
  );
  const currency = availability[0]?.currency ?? "USD";

  /** Group into sections, then rows, so the map renders as a real seating plan. */
  const sections = useMemo(() => {
    const bySection = new Map<
      string,
      { id: string; name: string; color: string; rows: Map<string, SeatNode[]> }
    >();

    for (const seat of seats) {
      const section = seat.seat?.section;
      if (!section) continue;
      if (!bySection.has(section.id)) {
        bySection.set(section.id, {
          id: section.id,
          name: section.name,
          color: section.color,
          rows: new Map(),
        });
      }
      const rows = bySection.get(section.id)!.rows;
      const label = seat.seat!.row_label;
      if (!rows.has(label)) rows.set(label, []);
      rows.get(label)!.push(seat);
    }

    return [...bySection.values()].map((section) => ({
      ...section,
      rows: [...section.rows.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([label, rowSeats]) => ({
          label,
          seats: rowSeats.sort(
            (a, b) => Number(a.seat!.seat_number) - Number(b.seat!.seat_number),
          ),
        })),
    }));
  }, [seats]);

  const seatById = useMemo(() => new Map(seats.map((s) => [s.id, s])), [seats]);

  const priceFor = useCallback(
    (seat: { price_cents: number | null; ticket_type_id: string | null }) => {
      const tier = seat.ticket_type_id ? priceByType.get(seat.ticket_type_id) : undefined;
      return seat.price_cents ?? tier?.price_cents ?? 0;
    },
    [priceByType],
  );

  const selection = useSeatSelection(seats, priceFor, MAX_SEATS);

  function toggle(seat: SeatNode) {
    const result = selection.toggle(seat.id);
    if (!result.ok) toast.error(result.reason);
  }

  const reserve = useAsyncAction(async () => {
    if (!signedIn) {
      router.push(`/auth/login?next=${encodeURIComponent(`/events/${eventId}`)}`);
      return;
    }
    if (selection.count === 0) {
      toast.error("Pick at least one seat");
      return;
    }

    const { data, error } = await createClient().rpc("create_reservation", {
      p_event_id: eventId,
      p_items: [],
      p_seat_ids: selection.selected,
    });

    if (error) {
      // Another buyer may have taken one of these seats meanwhile.
      toast.error("Could not hold those seats", { description: error.message });
      selection.clear();
      router.refresh();
      return;
    }

    const reservation = data as { reservation_id: string };
    router.push(`/checkout/${reservation.reservation_id}`);
  });

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="border-b border-hairline-soft bg-sunken px-4 py-3">
          <div className="mx-auto mb-1 h-1 w-2/3 rounded-full bg-line-2" />
          <p className="text-center text-2xs font-semibold uppercase tracking-[0.14em] text-ink-3">
            Stage
          </p>
        </div>

        <div className="overflow-x-auto px-4 py-5">
          <div className="mx-auto w-max space-y-6">
            {sections.map((section) => (
              <div key={section.id}>
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: section.color }}
                    aria-hidden
                  />
                  <p className="text-xs font-semibold text-ink-2">{section.name}</p>
                </div>

                <div className="space-y-1.5">
                  {section.rows.map((row) => (
                    <div key={row.label} className="flex items-center gap-2">
                      <span className="w-4 shrink-0 text-right text-2xs font-medium text-ink-3">
                        {row.label}
                      </span>
                      <div className="flex gap-1">
                        {row.seats.map((seat) => {
                          const isSelected = selection.isSelected(seat.id);
                          const available = seat.status === "available";
                          const tier = seat.ticket_type_id
                            ? priceByType.get(seat.ticket_type_id)
                            : undefined;

                          return (
                            <button
                              key={seat.id}
                              type="button"
                              disabled={!available}
                              onClick={() => toggle(seat)}
                              aria-label={`${section.name} row ${row.label} seat ${seat.seat!.seat_number}${
                                available ? "" : " (unavailable)"
                              }`}
                              aria-pressed={isSelected}
                              title={
                                available
                                  ? `${section.name} · Row ${row.label} · Seat ${seat.seat!.seat_number} — ${formatMoney(
                                      seat.price_cents ?? tier?.price_cents ?? 0,
                                      currency,
                                    )}`
                                  : "Unavailable"
                              }
                              className={cn(
                                "size-[18px] rounded-[4px] border text-[0px] transition-all",
                                isSelected
                                  ? "scale-110 border-transparent bg-solid"
                                  : available
                                    ? "border-hairline bg-card hover:bg-sunken-2"
                                    : "cursor-not-allowed border-transparent bg-n-200 dark:bg-n-800",
                              )}
                              style={
                                !isSelected && available
                                  ? { borderColor: `${section.color}66` }
                                  : undefined
                              }
                            >
                              {seat.seat!.seat_number}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-hairline-soft px-4 py-3">
          <Legend className="border-hairline bg-card" label="Available" />
          <Legend className="border-transparent bg-solid" label="Selected" />
          <Legend className="border-transparent bg-n-200 dark:bg-n-800" label="Taken" />
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-card shadow-e1 px-4 py-3.5">
        <div className="min-w-0">
          <p className="text-xs text-ink-3">
            {selection.count > 0
              ? selection.selected
                  .map((id) => {
                    const seat = seatById.get(id)!;
                    return `${seat.seat!.row_label}${seat.seat!.seat_number}`;
                  })
                  .join(", ")
              : "No seats selected"}
          </p>
          <p className="text-lg font-semibold tabular text-ink">
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
          {signedIn
            ? `Get ${selection.count || ""} ${selection.count === 1 ? "seat" : "seats"}`.trim()
            : "Sign in to book"}
        </Button>
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-ink-3">
      <span className={cn("size-3 rounded-[3px] border", className)} />
      {label}
    </span>
  );
}
