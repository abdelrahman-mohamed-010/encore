"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/surface";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select";
import { TableRowsSkeleton } from "@/components/ui/table";
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
  const columnCount = canRefund ? 7 : 6;

  function setStatusFilter(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") params.delete("status");
    else params.set("status", next);
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-56 max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by order #, buyer name, or email..."
              className="pl-9"
              aria-label="Search orders"
            />
          </div>

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

      <Card className="overflow-x-auto">
        <table className="table-stack w-full text-left text-sm sm:min-w-[52rem]">
          <thead>
            <tr className="border-b border-hairline text-2xs uppercase tracking-[0.06em] text-ink-3">
              <th scope="col" className="px-5 py-3.5 font-semibold">Order</th>
              <th scope="col" className="px-5 py-3.5 font-semibold">Buyer</th>
              <th scope="col" className="px-5 py-3.5 font-semibold">Event</th>
              <th scope="col" className="px-5 py-3.5 font-semibold">Date</th>
              <th scope="col" className="px-5 py-3.5 text-right font-semibold">Total</th>
              <th scope="col" className="px-5 py-3.5 font-semibold">Status</th>
              {canRefund && <th scope="col" className="px-5 py-3.5" />}
            </tr>
          </thead>
          <React.Suspense
            key={searchParams.toString()}
            fallback={<TableRowsSkeleton rows={6} columns={columnCount} />}
          >
            {children}
          </React.Suspense>
        </table>
      </Card>
    </div>
  );
}
