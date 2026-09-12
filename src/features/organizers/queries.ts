import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { EventSearchResult } from "@/lib/types";

export const getOrganizerBySlug = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase.from("organizers").select("*").eq("slug", slug).maybeSingle();
  return data;
});

export async function getOrganizerPublicPage(slug: string, ownerId: string) {
  const supabase = await createClient();

  const [{ data: events }, { data: ownerRows }] = await Promise.all([
    supabase.rpc("search_events", { p_organizer_slug: slug, p_limit: 50 }),
    supabase.from("public_profiles").select("id, full_name").eq("id", ownerId).limit(1),
  ]);

  return {
    events: (events ?? []) as EventSearchResult[],
    owner: ownerRows?.[0] ?? null,
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getHostProfile = cache(async (id: string) => {
  if (!UUID.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.rpc("host_profile", { p_id: id });
  return data?.[0] ?? null;
});

export async function getHostEvents(id: string) {
  const supabase = await createClient();

  const [{ data: upcoming }, { data: past }] = await Promise.all([
    supabase.rpc("host_events", { p_id: id, p_past: false, p_limit: 12 }),
    supabase.rpc("host_events", { p_id: id, p_past: true, p_limit: 6 }),
  ]);

  return { upcoming: upcoming ?? [], past: past ?? [] };
}
