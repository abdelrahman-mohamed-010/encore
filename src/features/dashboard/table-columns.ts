import type { TableColumn } from "@/components/ui/data-table";

/**
 * Plain data, so the client shell and the server rows can share one definition
 * without either pulling in the other's module graph. `length` is the colSpan
 * the empty state and pagination need, which used to be a hand-synced literal
 * in both files.
 */
export const EVENT_COLUMNS: TableColumn[] = [
  { label: "Event" },
  { label: "Date" },
  { label: "Status" },
  { label: "Seating" },
  { label: "Tickets Sold" },
  { label: "Gross", className: "text-right" },
  { className: "text-right" },
];

export const ATTENDEE_COLUMNS: TableColumn[] = [
  { label: "Attendee" },
  { label: "Event" },
  { label: "Ticket Type" },
  { label: "Ticket Code" },
  { label: "Check-in Status" },
];

export function orderColumns(canRefund: boolean): TableColumn[] {
  return [
    { label: "Order" },
    { label: "Buyer" },
    { label: "Event" },
    { label: "Date" },
    { label: "Total", className: "text-right" },
    { label: "Status" },
    ...(canRefund ? [{}] : []),
  ];
}
