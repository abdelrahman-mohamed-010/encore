"use client";

import { useMemo, useState } from "react";
import { Armchair } from "lucide-react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { loadEventSeatMap, type PreviewSeat } from "@/features/events/loaders";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { buildSeatPlan, SEAT_SIZE, type PlanSeat } from "@/lib/seat-plan";
import { cn } from "@/lib/utils";

type SeatRow = PreviewSeat;

/**
 * A read-only preview of the venue's seat layout for organizers — no
 * selection or booking, just "how does this look to buyers". Replaces
 * navigating to the public event page in a new tab.
 */
export function SeatMapPreviewButton({
  eventId,
  organizerSlug,
  venueName,
}: {
  eventId: string;
  organizerSlug: string;
  venueName: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [seats, setSeats] = useState<SeatRow[] | null>(null);

  async function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && !seats) {
      setLoading(true);
      const result = await loadEventSeatMap({ eventId, organizerSlug });
      setSeats(result?.data?.seats ?? []);
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Armchair /> View seat map
        </Button>
      </DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Seat map</DialogTitle>
          <DialogDescription>How this looks to buyers at {venueName}.</DialogDescription>
        </DialogHeader>
        <DialogBody className="p-0">
          {loading || !seats ? (
            <div className="grid h-80 place-items-center text-sm text-ink-3">Loading…</div>
          ) : (
            <SeatPreviewCanvas seats={seats} />
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

function SeatPreviewCanvas({ seats }: { seats: SeatRow[] }) {
  const plan = useMemo(() => {
    const placed: PlanSeat[] = seats.flatMap((seat) =>
      seat.seat?.section
        ? [
            {
              id: seat.id,
              x: Number(seat.seat.pos_x),
              y: Number(seat.seat.pos_y),
              status: seat.status,
              priceCents: 0,
              sectionId: seat.seat.section.id,
              sectionName: seat.seat.section.name,
              color: seat.seat.section.color,
              rowLabel: seat.seat.row_label,
              seatNumber: seat.seat.seat_number,
            },
          ]
        : [],
    );
    return buildSeatPlan(placed);
  }, [seats]);

  const sections = useMemo(() => {
    const bySection = new Map<string, { name: string; color: string }>();
    for (const seat of plan.points) {
      if (!bySection.has(seat.sectionId)) bySection.set(seat.sectionId, { name: seat.sectionName, color: seat.color });
    }
    return [...bySection.values()];
  }, [plan.points]);

  if (plan.points.length === 0) {
    return <div className="grid h-80 place-items-center text-sm text-ink-3">No seats to show yet.</div>;
  }

  return (
    <div>
      <TransformWrapper
        minScale={0.2}
        maxScale={5}
        wheel={{ step: 0.15 }}
        onInit={(ref) => ref.fitToView({ maxScale: 1 })}
      >
        <TransformComponent wrapperClass="!w-full !h-[min(60vh,28rem)] bg-sunken">
          <div className="relative" style={{ width: plan.width, height: plan.height }}>
            <div className="absolute -top-2 left-1/2 -translate-x-1/2" style={{ width: plan.width * 0.55 }}>
              <div className="h-1.5 rounded-full bg-line-2" />
              <p className="mt-1 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-3">
                Stage
              </p>
            </div>

            {plan.points.map((seat) => {
              const available = seat.status === "available";
              return (
                <div
                  key={seat.id}
                  className={cn(
                    "absolute -translate-x-1/2 -translate-y-1/2 rounded-[7px]",
                    !available && "bg-n-200 dark:bg-n-800",
                  )}
                  style={{
                    left: seat.left,
                    top: seat.top,
                    width: SEAT_SIZE,
                    height: SEAT_SIZE,
                    ...(available
                      ? { backgroundColor: `${seat.color}33`, boxShadow: `inset 0 0 0 1.5px ${seat.color}` }
                      : null),
                  }}
                />
              );
            })}
          </div>
        </TransformComponent>
      </TransformWrapper>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-hairline-soft px-4 py-3">
        {sections.map((section) => (
          <span key={section.name} className="flex items-center gap-1.5 text-xs text-ink-3">
            <span
              className="size-3 rounded-[3px]"
              style={{ backgroundColor: `${section.color}33`, boxShadow: `inset 0 0 0 1.5px ${section.color}` }}
            />
            {section.name}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-xs text-ink-3">
          <span className="size-3 rounded-[3px] bg-n-200 dark:bg-n-800" />
          Taken
        </span>
      </div>
    </div>
  );
}
