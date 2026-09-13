"use client";

import * as React from "react";
import { TableSearch } from "@/components/ui/table-search";
import { DataTableShell } from "@/components/ui/data-table";
import { USER_COLUMNS } from "@/features/admin/table-columns";
import { useDebouncedSearchParam } from "@/hooks";

/** Static shell: the search box. Server-driven — never a skeleton itself. */
export function UserTableShell({ children }: { children: React.ReactNode }) {
  const { value: query, onChange: setQuery } = useDebouncedSearchParam("q");

  return (
    <DataTableShell
      columns={USER_COLUMNS}
      minWidthClass="sm:min-w-[44rem]"
      toolbar={
        <form className="relative max-w-sm" onSubmit={(e) => e.preventDefault()}>
          <TableSearch value={query} onChange={setQuery} placeholder="Search by name or email" label="Search users" className="w-full" />
        </form>
      }
    >
      {children}
    </DataTableShell>
  );
}
