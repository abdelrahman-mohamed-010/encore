"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/surface";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select";
import { TableRowsSkeleton } from "@/components/ui/table";
import { useDebouncedSearchParam } from "@/hooks";

// Matches event-review-rows.tsx's column count — kept as a literal so this
// client shell never pulls in that server-only component's module graph.
const EVENT_REVIEW_COLUMN_COUNT = 5;

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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form className="relative max-w-sm flex-1 min-w-48" onSubmit={(e) => e.preventDefault()}>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by event title"
            className="pl-9"
            aria-label="Search events"
          />
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

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead>
            <tr className="border-b border-hairline text-2xs uppercase tracking-[0.06em] text-ink-3">
              <th scope="col" className="px-5 py-3.5 font-semibold">Event</th>
              <th scope="col" className="px-5 py-3.5 font-semibold">Date</th>
              <th scope="col" className="px-5 py-3.5 font-semibold">Organizer</th>
              <th scope="col" className="px-5 py-3.5 font-semibold">Status</th>
              <th scope="col" className="px-5 py-3.5 text-right" />
            </tr>
          </thead>
          <React.Suspense
            key={searchParams.toString()}
            fallback={<TableRowsSkeleton rows={6} columns={EVENT_REVIEW_COLUMN_COUNT} />}
          >
            {children}
          </React.Suspense>
        </table>
      </Card>
    </div>
  );
}
