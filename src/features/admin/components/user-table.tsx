"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/surface";
import { Input } from "@/components/ui/input";
import { TableRowsSkeleton } from "@/components/ui/table";
import { useDebouncedSearchParam } from "@/hooks";

// Matches user-table-rows.tsx's column count — kept as a literal so this
// client shell never pulls in that server-only component's module graph.
const USERS_COLUMN_COUNT = 5;

/** Static shell: the search box. Server-driven — never a skeleton itself. */
export function UserTableShell({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const { value: query, onChange: setQuery } = useDebouncedSearchParam("q");

  return (
    <div className="space-y-4">
      <form className="relative max-w-sm" onSubmit={(e) => e.preventDefault()}>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email"
          className="pl-9"
          aria-label="Search users"
        />
      </form>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead>
            <tr className="border-b border-hairline text-2xs uppercase tracking-[0.06em] text-ink-3">
              <th scope="col" className="px-5 py-3.5 font-semibold">User</th>
              <th scope="col" className="px-5 py-3.5 font-semibold">Joined</th>
              <th scope="col" className="px-5 py-3.5 font-semibold">Role</th>
              <th scope="col" className="px-5 py-3.5 font-semibold">Status</th>
              <th scope="col" className="px-5 py-3.5" />
            </tr>
          </thead>
          <React.Suspense
            key={searchParams.toString()}
            fallback={<TableRowsSkeleton rows={6} columns={USERS_COLUMN_COUNT} />}
          >
            {children}
          </React.Suspense>
        </table>
      </Card>
    </div>
  );
}
