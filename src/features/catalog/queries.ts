import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { buildSearchEventsArgs, type EventSearchParams } from "@/lib/event-search-params";
import type { Category, EventSearchResult } from "@/lib/types";

export async function getHomeData() {
  const supabase = await createClient();

  const [upcoming, categories, counts] = await Promise.all([
    supabase.rpc("search_events", { p_sort: "soonest", p_limit: 9 }),
    supabase.from("categories").select("*").eq("is_active", true).order("sort_order"),
    supabase.rpc("search_events", { p_limit: 1 }),
  ]);

  return {
    upcoming: (upcoming.data ?? []) as EventSearchResult[],
    categories: (categories.data ?? []) as Category[],
    totalEvents: counts.data?.[0]?.total_count ?? 0,
  };
}

export async function getEventFilterOptions() {
  const supabase = await createClient();

  const [{ data: categories }, { data: venues }] = await Promise.all([
    supabase.from("categories").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("venues").select("city").eq("is_active", true),
  ]);

  return {
    categories: (categories ?? []) as Category[],
    cities: [...new Set((venues ?? []).map((v) => v.city).filter(Boolean))].sort() as string[],
  };
}

export async function searchEvents(params: EventSearchParams, limit: number, offset: number) {
  const supabase = await createClient();
  return supabase.rpc("search_events", buildSearchEventsArgs(params, limit, offset));
}

export const getVenueBySlug = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("venues")
    .select(
      "id, name, slug, description, address_line1, address_line2, city, state, country, postal_code, latitude, longitude, capacity, image_url, is_active",
    )
    .eq("slug", slug)
    .maybeSingle();
  return data;
});

export async function getPlatformSettings() {
  const supabase = await createClient();
  const { data } = await supabase.from("platform_settings").select("*").maybeSingle();
  return data;
}
