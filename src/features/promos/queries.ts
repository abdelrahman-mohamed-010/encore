import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PromoCode } from "@/lib/types";

export type PromoListPage = {
  promos: PromoCode[];
  total: number;
  totalPages: number;
};

export async function listPromos({
  organizerId,
  query,
  page,
  pageSize,
}: {
  organizerId: string;
  query?: string;
  page: number;
  pageSize: number;
}): Promise<PromoListPage> {
  const supabase = await createClient();

  let dbQuery = supabase
    .from("promo_codes")
    .select("*", { count: "exact" })
    .eq("organizer_id", organizerId);

  if (query?.trim()) dbQuery = dbQuery.ilike("code", `%${query.trim()}%`);

  const from = (page - 1) * pageSize;
  const { data, count } = await dbQuery
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  const total = count ?? 0;
  return {
    promos: data ?? [],
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export type PromoEventOption = { id: string; title: string };

export async function listPromoEventOptions(organizerId: string): Promise<PromoEventOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("id, title")
    .eq("organizer_id", organizerId)
    .order("starts_at", { ascending: false });

  return data ?? [];
}
