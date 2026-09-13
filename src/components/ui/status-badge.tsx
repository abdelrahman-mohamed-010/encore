import { Badge } from "@/components/ui/badge";
import type { EventStatus, OrderStatus, TicketStatus } from "@/lib/types";

type Tone = "positive" | "caution" | "neutral" | "critical";

const EVENT_TONE: Record<EventStatus, Tone> = {
  published: "positive",
  draft: "neutral",
  pending_review: "caution",
  paused: "caution",
  cancelled: "critical",
  completed: "neutral",
};

const ORDER_TONE: Record<OrderStatus, Tone> = {
  paid: "positive",
  pending: "caution",
  failed: "critical",
  cancelled: "neutral",
  refunded: "critical",
  partially_refunded: "caution",
};

const TICKET_TONE: Record<TicketStatus, Tone> = {
  valid: "positive",
  used: "neutral",
  refunded: "critical",
  void: "critical",
};

type Size = "xs" | "sm" | "md";
type Props<T> = { status: T; size?: Size; className?: string };

export function eventStatusTone(status: EventStatus) {
  return EVENT_TONE[status];
}

export function EventStatusBadge({ status, size = "xs", className }: Props<EventStatus>) {
  return (
    <Badge tone={EVENT_TONE[status]} size={size} className={className}>
      {status.replace("_", " ")}
    </Badge>
  );
}

export function OrderStatusBadge({ status, size = "xs", className }: Props<OrderStatus>) {
  return (
    <Badge tone={ORDER_TONE[status]} size={size} className={className}>
      {status.replace("_", " ")}
    </Badge>
  );
}

export function TicketStatusBadge({ status, size = "xs", className }: Props<TicketStatus>) {
  return (
    <Badge tone={TICKET_TONE[status]} size={size} className={className}>
      {status === "used" ? "Checked in" : status}
    </Badge>
  );
}
