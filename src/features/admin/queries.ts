import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Paged } from "@/lib/pagination";
import type { EventStatus, Profile } from "@/lib/types";

export type UserProfile = Pick<
  Profile,
  "id" | "email" | "full_name" | "avatar_url" | "role" | "is_banned" | "created_at"
>;

export type ReviewEventItem = {
  id: string;
  title: string;
  slug: string;
  status: EventStatus;
  starts_at: string;
  cover_image_url: string | null;
  subtitle: string | null;
  created_at: string;
  organizer: { id: string; name: string; slug: string } | null;
  venue: { name: string; city: string | null } | null;
  ticket_types: { price_cents: number; quantity_total: number }[];
};

export async function listUsers({
  query,
  page,
  pageSize,
}: {
  query?: string;
  page: number;
  pageSize: number;
}): Promise<Paged<UserProfile>> {
  const supabase = await createClient();

  let dbQuery = supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, role, is_banned, created_at", { count: "exact" });

  if (query?.trim()) {
    const term = `%${query.trim()}%`;
    dbQuery = dbQuery.or(`email.ilike.${term},full_name.ilike.${term}`);
  }

  const from = (page - 1) * pageSize;
  const { data, count } = await dbQuery
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  const total = count ?? 0;
  return {
    rows: (data ?? []) as UserProfile[],
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function listEventsForReview({
  query,
  status,
  page,
  pageSize,
}: {
  query?: string;
  status?: string;
  page: number;
  pageSize: number;
}): Promise<Paged<ReviewEventItem>> {
  const supabase = await createClient();

  let dbQuery = supabase
    .from("events")
    .select(
      `id, title, slug, status, starts_at, cover_image_url, subtitle, created_at,
       organizer:organizers(id, name, slug),
       venue:venues(name, city),
       ticket_types(price_cents, quantity_total)`,
      { count: "exact" },
    )
    .in("status", ["pending_review", "published", "draft", "paused"]);

  if (status && status !== "all") dbQuery = dbQuery.eq("status", status as EventStatus);
  if (query?.trim()) dbQuery = dbQuery.ilike("title", `%${query.trim()}%`);

  const from = (page - 1) * pageSize;
  const { data, count } = await dbQuery
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  const total = count ?? 0;
  return {
    rows: (data ?? []) as ReviewEventItem[],
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function listAllCategories() {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").order("sort_order");
  return data ?? [];
}
