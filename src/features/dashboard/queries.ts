import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { EventStatus, OrderStatus } from "@/lib/types";

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
