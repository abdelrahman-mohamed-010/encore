"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TableSearch } from "@/components/ui/table-search";
import { SelectField } from "@/components/ui/select";
import { DataTableShell } from "@/components/ui/data-table";
import { ATTENDEE_COLUMNS } from "@/features/dashboard/table-columns";
import { useDebouncedSearchParam } from "@/hooks";

/** Static shell: search + event/status filters. Server-driven — never a skeleton itself. */
export function DashboardAttendeesShell({
  events,
  children,
}: {
  events: { id: string; title: string }[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { value: query, onChange: setQuery } = useDebouncedSearchParam("q");
  const eventFilter = searchParams.get("event") ?? "all";
  const statusFilter = searchParams.get("status") ?? "all";

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete(key);
    else params.set(key, value);
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <DataTableShell
      columns={ATTENDEE_COLUMNS}
      minWidthClass="sm:min-w-[48rem]"
      skeletonRows={8}
      toolbar={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <TableSearch value={query} onChange={setQuery} placeholder="Search by attendee, email, or code..." label="Search attendees" />

          <SelectField
            value={eventFilter}
            onChange={(val) => setParam("event", val)}
            aria-label="Filter attendees by event"
            className="w-48"
            options={[
              { value: "all", label: "All events" },
              ...events.map((e) => ({ value: e.id, label: e.title })),
            ]}
          />

          <SelectField
            value={statusFilter}
            onChange={(val) => setParam("status", val)}
            aria-label="Filter attendees by check-in status"
            className="w-40"
            options={[
              { value: "all", label: "All check-ins" },
              { value: "checked_in", label: "Checked in" },
              { value: "not_scanned", label: "Not scanned" },
            ]}
          />
        </div>
        </div>
      }
    >
      {children}
    </DataTableShell>
  );
}
