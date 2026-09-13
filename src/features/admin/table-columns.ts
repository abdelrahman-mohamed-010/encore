import type { TableColumn } from "@/components/ui/data-table";

/**
 * Plain data, so the client shell and the server rows can share one definition
 * without either pulling in the other's module graph. `length` is the colSpan
 * the empty state and pagination need, which used to be a hand-synced literal
 * in both files.
 */
export const USER_COLUMNS: TableColumn[] = [
  { label: "User" },
  { label: "Joined" },
  { label: "Role" },
  { label: "Status" },
  {},
];

export const EVENT_REVIEW_COLUMNS: TableColumn[] = [
  { label: "Event" },
  { label: "Date" },
  { label: "Organizer" },
  { label: "Status" },
  { className: "text-right" },
];
