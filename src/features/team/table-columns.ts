import type { TableColumn } from "@/components/ui/data-table";

/** Shared by the client shell's header and the server rows' colSpan. */
export const TEAM_COLUMNS: TableColumn[] = [
  { label: "Member" },
  { label: "Email" },
  { label: "Role" },
  { className: "text-right" },
];
