"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/surface";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select";
import { TableRowsSkeleton } from "@/components/ui/table";
import { useDebouncedSearchParam } from "@/hooks";

// Matches dashboard-attendees-rows.tsx's column count — kept as a literal so
// this client shell never pulls in that server-only component's module graph.
const ATTENDEES_COLUMN_COUNT = 5;

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
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-56 max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by attendee, email, or code..."
              className="pl-9"
              aria-label="Search attendees"
            />
          </div>

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

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead>
            <tr className="border-b border-hairline text-2xs uppercase tracking-[0.06em] text-ink-3">
              <th scope="col" className="px-5 py-3.5 font-semibold">Attendee</th>
              <th scope="col" className="px-5 py-3.5 font-semibold">Event</th>
              <th scope="col" className="px-5 py-3.5 font-semibold">Ticket Type</th>
              <th scope="col" className="px-5 py-3.5 font-semibold">Ticket Code</th>
              <th scope="col" className="px-5 py-3.5 font-semibold">Check-in Status</th>
            </tr>
          </thead>
          <React.Suspense
            key={searchParams.toString()}
            fallback={<TableRowsSkeleton rows={8} columns={ATTENDEES_COLUMN_COUNT} />}
          >
            {children}
          </React.Suspense>
        </table>
      </Card>
    </div>
  );
}
