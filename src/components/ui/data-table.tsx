"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/surface";
import { TableRowsSkeleton } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type TableColumn = {
  /** Header text. Omit for an actions column, which renders an empty header. */
  label?: string;
  className?: string;
};

/**
 * The shell every list screen was rebuilding by hand: the card, the table, the
 * header row and the Suspense boundary that re-suspends when the filters in
 * the URL change. Six copies had drifted apart on padding and column counts.
 *
 * Columns are data rather than markup so the same array can size the header
 * here and the colSpan of the empty state and pagination in the server rows.
 */
export function DataTableShell({
  columns,
  minWidthClass,
  toolbar,
  skeletonRows = 6,
  children,
}: {
  columns: TableColumn[];
  /** e.g. "sm:min-w-[44rem]" — the width below which the table scrolls. */
  minWidthClass?: string;
  toolbar?: React.ReactNode;
  skeletonRows?: number;
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();

  return (
    <div className="space-y-4">
      {toolbar}

      <Card className="overflow-x-auto">
        <table className={cn("table-stack w-full text-left text-sm", minWidthClass)}>
          <thead>
            <tr className="border-b border-hairline text-2xs uppercase tracking-[0.06em] text-ink-3">
              {columns.map((column, index) => (
                <th
                  key={column.label ?? `col-${index}`}
                  scope="col"
                  className={cn("px-5 py-3.5", column.label && "font-semibold", column.className)}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <React.Suspense
            key={searchParams.toString()}
            fallback={<TableRowsSkeleton rows={skeletonRows} columns={columns.length} />}
          >
            {children}
          </React.Suspense>
        </table>
      </Card>
    </div>
  );
}
