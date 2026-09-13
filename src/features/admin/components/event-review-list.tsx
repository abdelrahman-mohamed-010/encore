"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TableSearch } from "@/components/ui/table-search";
import { SelectField } from "@/components/ui/select";
import { DataTableShell } from "@/components/ui/data-table";
import { EVENT_REVIEW_COLUMNS } from "@/features/admin/table-columns";
import { useDebouncedSearchParam } from "@/hooks";

/** Static shell: search + status filter. Server-driven — never a skeleton itself. */
export function EventReviewShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { value: query, onChange: setQuery } = useDebouncedSearchParam("q");
  const statusFilter = searchParams.get("status") ?? "all";

  function setStatusFilter(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") params.delete("status");
    else params.set("status", next);
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <DataTableShell
      columns={EVENT_REVIEW_COLUMNS}
      minWidthClass="sm:min-w-[44rem]"
      toolbar={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <form className="relative max-w-sm flex-1 min-w-48" onSubmit={(e) => e.preventDefault()}>
            <TableSearch value={query} onChange={setQuery} placeholder="Search by event title" label="Search events" className="w-full" />
          </form>

          <SelectField
            value={statusFilter}
            onChange={setStatusFilter}
            aria-label="Filter events by status"
            size="sm"
            className="w-40"
            options={[
              { value: "all", label: "All Statuses" },
              { value: "pending_review", label: "Pending Review" },
              { value: "published", label: "Published" },
              { value: "draft", label: "Draft" },
              { value: "paused", label: "Paused" },
            ]}
          />
        </div>
      }
    >
      {children}
    </DataTableShell>
  );
}
