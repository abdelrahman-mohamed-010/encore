"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { TableSearch } from "@/components/ui/table-search";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select";
import { DataTableShell } from "@/components/ui/data-table";
import { EVENT_COLUMNS } from "@/features/dashboard/table-columns";
import { useDebouncedSearchParam } from "@/hooks";
import { EventFormDrawer } from "@/features/events/components/event-form-drawer";

/** Static shell: search, status filter, "New event". Server-driven — never a skeleton itself. */
export function DashboardEventsShell({
  slug,
  organizerId,
  children,
}: {
  slug: string;
  /** Omitted only by the route's loading.tsx, which has no data fetch of its own yet. */
  organizerId?: string;
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
    <DataTableShell
      columns={EVENT_COLUMNS}
      minWidthClass="sm:min-w-[50rem]"
      toolbar={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <TableSearch value={query} onChange={setQuery} placeholder="Search events by title..." label="Search events" />

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

        {organizerId ? (
          <EventFormDrawer
            organizerId={organizerId}
            organizerSlug={slug}
            trigger={
              <Button variant="solid" size="md">
                <Plus /> New event
              </Button>
            }
          />
        ) : (
          <Button variant="solid" size="md" disabled>
            <Plus /> New event
          </Button>
        )}
        </div>
      }
    >
      {children}
    </DataTableShell>
  );
}
