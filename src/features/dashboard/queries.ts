import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { EventStatus, OrderStatus, OrganizerStats } from "@/lib/types";
import type { SalesPoint } from "@/components/dashboard/sales-chart";

export type Paged<T> = { rows: T[]; total: number; totalPages: number };

function paginate<T>(rows: T[] | null, count: number | null, pageSize: number): Paged<T> {
  const total = count ?? 0;
  return { rows: rows ?? [], total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export type DashboardEventItem = {
  id: string;
  title: string;
  slug: string;
  status: EventStatus;
  starts_at: string;
  cover_image_url: string | null;
  seating_type: string | null;
  ticket_types?: {
    price_cents: number;
    currency: string;
    quantity_total: number;
    quantity_sold: number;
    quantity_reserved: number;
  }[];
};

export async function listOrganizerEvents({
  organizerId,
  query,
  status,
  page,
  pageSize,
}: {
  organizerId: string;
  query?: string;
  status?: string;
  page: number;
  pageSize: number;
}): Promise<Paged<DashboardEventItem>> {
  const supabase = await createClient();

  let dbQuery = supabase
    .from("events")
    .select(
      `id, title, slug, status, starts_at, cover_image_url, seating_type,
       ticket_types(price_cents, currency, quantity_total, quantity_sold, quantity_reserved)`,
      { count: "exact" },
    )
    .eq("organizer_id", organizerId);

  if (query?.trim()) dbQuery = dbQuery.ilike("title", `%${query.trim()}%`);
  if (status && status !== "all") dbQuery = dbQuery.eq("status", status as EventStatus);

  const from = (page - 1) * pageSize;
  const { data, count } = await dbQuery
    .order("starts_at", { ascending: false })
    .range(from, from + pageSize - 1);

  return paginate(data as DashboardEventItem[] | null, count, pageSize);
}

export type DashboardOrderItem = {
  id: string;
  order_number: string;
  status: OrderStatus;
  total_cents: number;
  refunded_cents: number;
  currency: string;
  created_at: string;
  buyer_name: string;
  buyer_email: string;
  payment_provider: string | null;
  event: { title: string } | null;
  ticketCount: number;
};

export async function listOrganizerOrders({
  organizerId,
  query,
  status,
  page,
  pageSize,
}: {
  organizerId: string;
  query?: string;
  status?: string;
  page: number;
  pageSize: number;
}): Promise<Paged<DashboardOrderItem>> {
  const supabase = await createClient();

  let dbQuery = supabase
    .from("orders")
    .select(
      `id, order_number, status, total_cents, refunded_cents, currency, created_at,
       buyer_name, buyer_email, payment_provider,
       event:events(title),
       tickets:tickets(count)`,
      { count: "exact" },
    )
    .eq("organizer_id", organizerId);

  if (status && status !== "all") dbQuery = dbQuery.eq("status", status as OrderStatus);
  if (query?.trim()) {
    const term = `%${query.trim()}%`;
    dbQuery = dbQuery.or(
      `order_number.ilike.${term},buyer_name.ilike.${term},buyer_email.ilike.${term}`,
    );
  }

  const from = (page - 1) * pageSize;
  const { data, count } = await dbQuery
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  const rows = (data ?? []).map((order) => {
    const { tickets, ...rest } = order as typeof order & { tickets: { count: number }[] | null };
    return { ...rest, ticketCount: tickets?.[0]?.count ?? 0 } as DashboardOrderItem;
  });

  return paginate(rows, count, pageSize);
}

export type DashboardAttendeeItem = {
  id: string;
  ticket_code: string;
  attendee_name: string | null;
  attendee_email: string | null;
  seat_label: string | null;
  status: string;
  checked_in_at: string | null;
  ticket_type: { name: string } | null;
  event: { title: string } | null;
};

export async function listOrganizerAttendees({
  eventIds,
  query,
  statusFilter,
  page,
  pageSize,
}: {
  eventIds: string[];
  query?: string;
  statusFilter?: string;
  page: number;
  pageSize: number;
}): Promise<Paged<DashboardAttendeeItem>> {
  const supabase = await createClient();

  let dbQuery = supabase
    .from("tickets")
    .select(
      `id, ticket_code, attendee_name, attendee_email, seat_label, status, checked_in_at,
       ticket_type:ticket_types(name),
       event:events(title)`,
      { count: "exact" },
    )
    .in("event_id", eventIds);

  if (statusFilter === "checked_in") dbQuery = dbQuery.eq("status", "used");
  else if (statusFilter === "not_scanned") dbQuery = dbQuery.eq("status", "valid");

  if (query?.trim()) {
    const term = `%${query.trim()}%`;
    dbQuery = dbQuery.or(
      `attendee_name.ilike.${term},attendee_email.ilike.${term},ticket_code.ilike.${term}`,
    );
  }

  const from = (page - 1) * pageSize;
  const { data, count } = await dbQuery
    .order("issued_at", { ascending: false })
    .range(from, from + pageSize - 1);

  return paginate(data as DashboardAttendeeItem[] | null, count, pageSize);
}

export type RecentEvent = {
  id: string;
  title: string;
  slug: string;
  status: EventStatus;
  starts_at: string;
  cover_image_url: string | null;
};

export type OverviewPromises = {
  stats: PromiseLike<OrganizerStats>;
  series: PromiseLike<SalesPoint[]>;
  events: PromiseLike<RecentEvent[]>;
  account: PromiseLike<{ charges_enabled: boolean; stripe_account_id: string | null } | null>;
};

/**
 * Deliberately returns promises rather than awaiting: the overview's quick
 * actions render instantly and each section suspends on its own.
 */
export async function getOrganizerOverview(organizerId: string): Promise<OverviewPromises> {
  const supabase = await createClient();

  return {
    stats: supabase
      .rpc("organizer_stats", { p_organizer_id: organizerId })
      .then(({ data }) => (data ?? {}) as OrganizerStats),
    series: supabase
      .rpc("organizer_sales_series", { p_organizer_id: organizerId, p_days: 14 })
      .then(({ data }) => (data ?? []) as SalesPoint[]),
    events: supabase
      .from("events")
      .select("id, title, slug, status, starts_at, cover_image_url")
      .eq("organizer_id", organizerId)
      .order("starts_at", { ascending: true })
      .limit(6)
      .then(({ data }) => (data ?? []) as RecentEvent[]),
    account: supabase
      .from("payment_accounts")
      .select("charges_enabled, stripe_account_id")
      .eq("organizer_id", organizerId)
      .maybeSingle()
      .then(({ data }) => data),
  };
}

export async function listOrganizerEventOptions(organizerId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("id, title")
    .eq("organizer_id", organizerId)
    .order("starts_at", { ascending: false });
  return data ?? [];
}

export async function listScannableEvents(organizerId: string, windowStart: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("id, title, starts_at")
    .eq("organizer_id", organizerId)
    .eq("status", "published")
    .gte("ends_at", windowStart)
    .order("starts_at", { ascending: true });
  return data ?? [];
}

export async function getPaymentAccount(organizerId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payment_accounts")
    .select("*")
    .eq("organizer_id", organizerId)
    .maybeSingle();
  return data;
}
