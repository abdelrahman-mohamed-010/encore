"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { TableSearch } from "@/components/ui/table-search";
import { SelectField } from "@/components/ui/select";
import { DataTableShell } from "@/components/ui/data-table";
import { orderColumns } from "@/features/dashboard/table-columns";
import { useDebouncedSearchParam } from "@/hooks";

/** Static shell: search + status filter. Server-driven — never a skeleton itself. */
export function DashboardOrdersShell({
  canRefund,
  children,
}: {
  canRefund: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { value: query, onChange: setQuery } = useDebouncedSearchParam("q");
  const statusFilter = searchParams.get("status") ?? "all";
  const columns = orderColumns(canRefund);

  function setStatusFilter(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") params.delete("status");
    else params.set("status", next);
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <DataTableShell
      columns={columns}
      minWidthClass="sm:min-w-[52rem]"
      toolbar={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <TableSearch value={query} onChange={setQuery} placeholder="Search by order #, buyer name, or email..." label="Search orders" />

          <SelectField
            value={statusFilter}
            onChange={setStatusFilter}
            aria-label="Filter orders by status"
            className="w-40"
            options={[
              { value: "all", label: "All statuses" },
              { value: "paid", label: "Paid" },
              { value: "pending", label: "Pending" },
              { value: "partially_refunded", label: "Partially refunded" },
              { value: "refunded", label: "Refunded" },
              { value: "cancelled", label: "Cancelled" },
              { value: "failed", label: "Failed" },
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
