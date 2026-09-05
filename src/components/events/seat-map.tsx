"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Maximize2 } from "lucide-react";
import {
  TransformComponent,
  TransformWrapper,
  type ReactZoomPanPinchContentRef,
} from "react-zoom-pan-pinch";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAsyncAction, useSeatSelection } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/surface";
import { buildSeatPlan, seatInDirection, SEAT_SIZE, type PlanSeat } from "@/lib/seat-plan";
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
/** Below this the seat is too small to letter; above it, the number is legible. */
const LABEL_AT_SCALE = 1.5;

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
  const zoom = useRef<ReactZoomPanPinchContentRef>(null);
  const [scale, setScale] = useState(1);
  const [focused, setFocused] = useState<string | null>(null);

  const priceByType = useMemo(
    () => new Map(availability.map((tier) => [tier.ticket_type_id, tier])),
    [availability],
  );
  const currency = availability[0]?.currency ?? "USD";

  const priceFor = useCallback(
    (seat: { price_cents: number | null; ticket_type_id: string | null }) => {
      const tier = seat.ticket_type_id ? priceByType.get(seat.ticket_type_id) : undefined;
      return seat.price_cents ?? tier?.price_cents ?? 0;
    },
    [priceByType],
  );

  /** The stored layout, drawn at its own proportions rather than as a grid. */
  const plan = useMemo(() => {
    const placed: PlanSeat[] = seats.flatMap((seat) =>
      seat.seat?.section
        ? [{
            id: seat.id,
            x: Number(seat.seat.pos_x),
            y: Number(seat.seat.pos_y),
            status: seat.status,
            priceCents: priceFor(seat),
            sectionId: seat.seat.section.id,
            sectionName: seat.seat.section.name,
            color: seat.seat.section.color,
            rowLabel: seat.seat.row_label,
            seatNumber: seat.seat.seat_number,
          }]
        : [],
    );
    return buildSeatPlan(placed);
  }, [seats, priceFor]);

  /** One legend entry per section, with what a seat there costs. */
  const sections = useMemo(() => {
    const bySection = new Map<string, { name: string; color: string; from: number }>();
    for (const seat of plan.points) {
      const entry = bySection.get(seat.sectionId);
      if (entry) entry.from = Math.min(entry.from, seat.priceCents);
      else bySection.set(seat.sectionId, { name: seat.sectionName, color: seat.color, from: seat.priceCents });
    }
    return [...bySection.values()].sort((a, b) => b.from - a.from);
  }, [plan.points]);

  const seatById = useMemo(() => new Map(plan.points.map((seat) => [seat.id, seat])), [plan.points]);
  const selection = useSeatSelection(seats, priceFor, MAX_SEATS);

  // One tab stop for the whole plan: arrow keys move between seats from there,
  // which beats tabbing through several hundred of them.
  const tabStop = focused ?? plan.points.find((seat) => seat.status === "available")?.id;

  function toggle(seatId: string) {
    const result = selection.toggle(seatId);
    if (!result.ok) toast.error(result.reason);
  }

  function handleKeyDown(event: React.KeyboardEvent, seatId: string) {
    const directions = {
      ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
    } as const;
    const direction = directions[event.key as keyof typeof directions];
    if (!direction) return;

    const from = seatById.get(seatId);
    if (!from) return;

    const next = seatInDirection(from, plan.points, direction);
    if (!next) return;

    event.preventDefault();
    setFocused(next.id);
    document.getElementById(`seat-${next.id}`)?.focus();
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

  const showLabels = scale >= LABEL_AT_SCALE;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <TransformWrapper
          ref={zoom}
          minScale={0.2}
          maxScale={5}
          doubleClick={{ mode: "zoomIn", step: 0.7 }}
          wheel={{ step: 0.15 }}
          // Open on the whole plan. A venue is taller than the panel it sits
          // in, so starting at 1:1 would drop the back rows below the fold.
          onInit={(ref) => ref.fitToView({ maxScale: 1 })}
          onTransform={(_, state) => setScale(state.scale)}
        >
          <div className="relative">
            {/* The wrapper is the viewport; the content must keep the plan's
                own size or there is nothing for fitToView to measure. */}
            <TransformComponent wrapperClass="!w-full !h-[min(70vh,34rem)] bg-sunken">
              <div
                className="relative"
                style={{ width: plan.width, height: plan.height }}
              >
                {/* The stage, drawn to the plan's own width so it scales with it. */}
                <div
                  className="absolute -top-2 left-1/2 -translate-x-1/2"
                  style={{ width: plan.width * 0.55 }}
                >
                  <div className="h-1.5 rounded-full bg-line-2" />
                  <p className="mt-1 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-3">
                    Stage
                  </p>
                </div>

                {plan.points.map((seat) => {
                  const isSelected = selection.isSelected(seat.id);
                  const available = seat.status === "available";

                  return (
                    <button
                      key={seat.id}
                      id={`seat-${seat.id}`}
                      type="button"
                      // Not `disabled`: that would drop the seat out of the
                      // focus order, stalling arrow keys on a taken row.
                      aria-disabled={!available}
                      tabIndex={seat.id === tabStop ? 0 : -1}
                      onFocus={() => setFocused(seat.id)}
                      onKeyDown={(event) => handleKeyDown(event, seat.id)}
                      onClick={() => toggle(seat.id)}
                      aria-label={`${seat.sectionName} row ${seat.rowLabel} seat ${seat.seatNumber}, ${
                        available ? formatMoney(seat.priceCents, currency) : "unavailable"
                      }`}
                      aria-pressed={isSelected}
                      title={
                        available
                          ? `${seat.sectionName} · Row ${seat.rowLabel} · Seat ${seat.seatNumber} — ${formatMoney(
                              seat.priceCents,
                              currency,
                            )}`
                          : "Unavailable"
                      }
                      className={cn(
                        "absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[7px]",
                        "text-[10px] font-semibold leading-none transition-[transform,background-color]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
                        isSelected
                          ? "scale-110 bg-solid text-on-solid"
                          : available
                            ? "text-ink-2 hover:scale-110"
                            : "cursor-not-allowed bg-n-200 text-transparent dark:bg-n-800",
                      )}
                      style={{
                        left: seat.left,
                        top: seat.top,
                        width: SEAT_SIZE,
                        height: SEAT_SIZE,
                        ...(available && !isSelected
                          ? { backgroundColor: `${seat.color}33`, boxShadow: `inset 0 0 0 1.5px ${seat.color}` }
                          : null),
                      }}
                    >
                      {showLabels && available ? seat.seatNumber : ""}
                    </button>
                  );
                })}
              </div>
            </TransformComponent>

            <div className="absolute right-3 top-3 flex flex-col gap-1 rounded-lg bg-card p-1 shadow-e2">
              <Button variant="ghost" size="icon-sm" aria-label="Zoom in" onClick={() => zoom.current?.zoomIn()}>
                <Plus />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Zoom out" onClick={() => zoom.current?.zoomOut()}>
                <Minus />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Fit the whole plan" onClick={() => zoom.current?.fitToView({ maxScale: 1 })}>
                <Maximize2 />
              </Button>
            </div>
          </div>
        </TransformWrapper>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-hairline-soft px-4 py-3">
          {sections.map((section) => (
            <span key={section.name} className="flex items-center gap-1.5 text-xs text-ink-3">
              <span
                className="size-3 rounded-[3px]"
                style={{ backgroundColor: `${section.color}33`, boxShadow: `inset 0 0 0 1.5px ${section.color}` }}
              />
              {section.name}
              <span className="tabular text-ink-2">{formatMoney(section.from, currency)}</span>
            </span>
          ))}
          <span className="flex items-center gap-1.5 text-xs text-ink-3">
            <span className="size-3 rounded-[3px] bg-solid" />
            Selected
          </span>
          <span className="flex items-center gap-1.5 text-xs text-ink-3">
            <span className="size-3 rounded-[3px] bg-n-200 dark:bg-n-800" />
            Taken
          </span>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-card shadow-e1 px-4 py-3.5">
        <div className="min-w-0">
          <p className="text-xs text-ink-3">
            {selection.count > 0
              ? selection.selected
                  .map((id) => {
                    const seat = seatById.get(id);
                    return seat ? `${seat.rowLabel}${seat.seatNumber}` : "";
                  })
                  .filter(Boolean)
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
