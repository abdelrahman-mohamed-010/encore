"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/surface";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select";
import { TableRowsSkeleton } from "@/components/ui/table";
import { useDebouncedSearchParam } from "@/hooks";

// Matches the column count in dashboard-events-rows.tsx's <thead>/<tbody> —
// kept as a literal (not a shared import) so this client shell never pulls
// in that server-only row component's module graph.
const EVENTS_COLUMN_COUNT = 7;

/** Static shell: search, status filter, "New event". Server-driven — never a skeleton itself. */
export function DashboardEventsShell({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-56 max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events by title..."
              className="pl-9"
              aria-label="Search events"
            />
          </div>

          <SelectField
            value={statusFilter}
            onChange={setStatusFilter}
            aria-label="Filter events by status"
            className="w-40"
            options={[
              { value: "all", label: "All statuses" },
              { value: "published", label: "Published" },
              { value: "draft", label: "Draft" },
              { value: "pending_review", label: "Pending review" },
              { value: "paused", label: "Paused" },
              { value: "completed", label: "Completed" },
              { value: "cancelled", label: "Cancelled" },
            ]}
          />
        </div>

        <Button asChild variant="solid" size="md">
          <Link href={`/dashboard/${slug}/events/new`}>
            <Plus /> New event
          </Link>
        </Button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[50rem] text-left text-sm">
          <thead>
            <tr className="border-b border-hairline text-2xs uppercase tracking-[0.06em] text-ink-3">
              <th scope="col" className="px-5 py-3.5 font-semibold">Event</th>
              <th scope="col" className="px-5 py-3.5 font-semibold">Date</th>
              <th scope="col" className="px-5 py-3.5 font-semibold">Status</th>
              <th scope="col" className="px-5 py-3.5 font-semibold">Seating</th>
              <th scope="col" className="px-5 py-3.5 font-semibold">Tickets Sold</th>
              <th scope="col" className="px-5 py-3.5 text-right font-semibold">Gross</th>
              <th scope="col" className="px-5 py-3.5 text-right" />
            </tr>
          </thead>
          <React.Suspense
            key={searchParams.toString()}
            fallback={<TableRowsSkeleton rows={6} columns={EVENTS_COLUMN_COUNT} />}
          >
            {children}
          </React.Suspense>
        </table>
      </Card>
    </div>
  );
}
