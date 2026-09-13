import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildSearchEventsArgs } from "@/features/catalog/search-params";
import type { EventSearchResult } from "@/lib/types";

const PAGE_SIZE = 20;

/** Backs the public events grid's "Load more" button with the next page of the same search. */
export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const offset = Math.max(0, Number(params.offset) || 0);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    "search_events",
    buildSearchEventsArgs(params, PAGE_SIZE, offset),
  );

  if (error) {
    return NextResponse.json({ error: "Could not load more events." }, { status: 500 });
  }

  const events = (data ?? []) as EventSearchResult[];
  const total = Number(events[0]?.total_count ?? 0);

  return NextResponse.json({ events, total });
}
