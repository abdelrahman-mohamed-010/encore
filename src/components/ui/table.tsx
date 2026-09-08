"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select";
import { Shimmer } from "@/components/ui/skeleton";

/**
 * Table primitives. The wrapper owns the horizontal scroll so a wide table
 * scrolls inside its card instead of pushing the whole page sideways on mobile.
 */

export function TableWrap({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("w-full overflow-x-auto", className)} {...props} />;
}

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn("w-full min-w-160 caption-bottom text-sm", className)} {...props} />;
}

export function THead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("border-b border-hairline", className)} {...props} />;
}

export function TBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

export function TR({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn("border-b border-hairline-soft transition-colors hover:bg-sunken/60", className)}
      {...props}
    />
  );
}

export function TH({
  className,
  numeric,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <th
      scope="col"
      className={cn(
        "px-5 py-3.5 text-left text-2xs font-semibold uppercase tracking-[0.06em] text-ink-3",
        numeric && "text-right",
        className,
      )}
      {...props}
    />
  );
}

export function TD({
  className,
  numeric,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <td
      className={cn("px-5 py-3.5 align-middle text-ink", numeric && "text-right tnum", className)}
      {...props}
    />
  );
}

export function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  className,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}) {
  if (totalItems === 0) return null;

  const start = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const end = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with elision
  const pages: (number | "ellipsis")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("ellipsis");
    const pStart = Math.max(2, currentPage - 1);
    const pEnd = Math.min(totalPages - 1, currentPage + 1);
    for (let i = pStart; i <= pEnd; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("ellipsis");
    pages.push(totalPages);
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-hairline-soft px-5 py-3.5 text-xs text-ink-3",
        className,
      )}
    >
      {/* Items count */}
      <div>
        Showing <span className="font-semibold text-ink">{start}</span>–
        <span className="font-semibold text-ink">{end}</span> of{" "}
        <span className="font-semibold text-ink">{totalItems}</span>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 mr-2">
            <span className="text-2xs text-ink-3">Rows:</span>
            <div className="w-20">
              <SelectField
                value={String(pageSize)}
                onChange={(val) => onPageSizeChange(Number(val))}
                size="sm"
                aria-label="Rows per page"
                options={pageSizeOptions.map((opt) => ({
                  value: String(opt),
                  label: String(opt),
                }))}
              />
            </div>
          </div>
        )}

        {/* Previous Button */}
        <Button
          variant="ghost"
          size="xs"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="rounded-lg gap-1"
        >
          <ChevronLeft className="size-3.5" />
          <span>Prev</span>
        </Button>

        {/* Page Pills */}
        <div className="flex items-center gap-1">
          {pages.map((p, idx) =>
            p === "ellipsis" ? (
              <span key={`ellipsis-${idx}`} className="px-1 text-ink-3">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={cn(
                  "size-7 cursor-pointer rounded-lg text-xs font-semibold transition-colors",
                  p === currentPage
                    ? "bg-solid text-on-solid shadow-xs"
                    : "text-ink-2 hover:bg-sunken hover:text-ink",
                )}
                aria-label={`Page ${p}`}
                aria-current={p === currentPage ? "page" : undefined}
              >
                {p}
              </button>
            ),
          )}
        </div>

        {/* Next Button */}
        <Button
          variant="ghost"
          size="xs"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="rounded-lg gap-1"
        >
          <span>Next</span>
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

/** A table's "no rows" state — same icon-chip + title + description shape as `EmptyState`, just inside a `<tbody>`. */
export function TableEmptyRow({
  icon: Icon,
  title,
  description,
  columns,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  columns: number;
  action?: React.ReactNode;
}) {
  return (
    <tbody>
      <tr>
        <td colSpan={columns} className="px-5 py-16 text-center">
          <div className="flex flex-col items-center gap-4">
            <span className="grid size-12 place-items-center rounded-xl bg-sunken text-ink-3">
              <Icon className="size-5" />
            </span>
            <div className="space-y-1.5">
              <p className="text-md font-medium text-ink">{title}</p>
              <p className="mx-auto max-w-sm text-sm leading-relaxed text-ink-3">{description}</p>
            </div>
            {action}
          </div>
        </td>
      </tr>
    </tbody>
  );
}

/**
 * Suspense fallback for a table body: one flat block per row, spanning every
 * column, the same height as a real row. Use as the `fallback` for a
 * `<Suspense>` wrapping the `<tbody>`/`<tfoot>` of a table whose `<thead>`
 * renders outside the boundary and never needs a skeleton.
 */
export function TableRowsSkeleton({
  rows = 6,
  columns,
  rowHeight = "h-11",
}: {
  rows?: number;
  columns: number;
  rowHeight?: string;
}) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-hairline-soft last:border-b-0">
          <td colSpan={columns} className="px-5 py-3.5">
            <Shimmer className={cn(rowHeight, "rounded-lg")} />
          </td>
        </tr>
      ))}
    </tbody>
  );
}

/** A `<tr>` that navigates on click — for tables whose row IS the primary action. */
export function RowLink({
  href,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & { href: string }) {
  const router = useRouter();
  return (
    <tr
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a, button")) return;
        router.push(href);
      }}
      className={cn(
        "cursor-pointer border-b border-hairline-soft last:border-b-0 transition-colors hover:bg-sunken/70",
        className,
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

/**
 * Drives `TablePagination` off the URL's `page` param instead of client
 * state — for server-rendered tables where the page itself re-fetches.
 */
export function PaginationRow({
  page,
  totalPages,
  total,
  pageSize,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function goToPage(next: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (next <= 1) params.delete("page");
    else params.set("page", String(next));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <TablePagination
      currentPage={page}
      totalPages={totalPages}
      totalItems={total}
      pageSize={pageSize}
      onPageChange={goToPage}
    />
  );
}

/**
 * Reusable hook to handle client-side table pagination effortlessly.
 */
export function useTablePagination<T>(items: T[], initialPageSize = 10) {
  const [storedPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(initialPageSize);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  // Derived at render time rather than clamped via an effect + setState: if
  // the item count shrinks and the stored page overshoots, this falls back
  // to the last real page immediately, with no extra render in between.
  const currentPage = Math.min(storedPage, totalPages);

  const paginatedItems = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  return {
    paginatedItems,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    setPage: setCurrentPage,
    setPageSize: (size: number) => {
      setPageSize(size);
      setCurrentPage(1);
    },
  };
}
