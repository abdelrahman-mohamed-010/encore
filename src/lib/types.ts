import type { Database } from "./supabase/database.types";

export type Tables = Database["public"]["Tables"];
export type Enums = Database["public"]["Enums"];
export type Functions = Database["public"]["Functions"];

export type Profile = Tables["profiles"]["Row"];
export type Organizer = Tables["organizers"]["Row"];
export type OrganizerMember = Tables["organizer_members"]["Row"];
export type PaymentAccount = Tables["payment_accounts"]["Row"];
export type Category = Tables["categories"]["Row"];
export type Venue = Tables["venues"]["Row"];
export type VenueSection = Tables["venue_sections"]["Row"];
export type VenueSeat = Tables["venue_seats"]["Row"];
export type EventRow = Tables["events"]["Row"];
export type TicketType = Tables["ticket_types"]["Row"];
export type EventSeat = Tables["event_seats"]["Row"];
export type Order = Tables["orders"]["Row"];
export type OrderItem = Tables["order_items"]["Row"];
export type Ticket = Tables["tickets"]["Row"];
export type PromoCode = Tables["promo_codes"]["Row"];
export type Refund = Tables["refunds"]["Row"];
export type Notification = Tables["notifications"]["Row"];

export type UserRole = Enums["user_role"];
export type OrgMemberRole = Enums["org_member_role"];
export type EventStatus = Enums["event_status"];
export type OrderStatus = Enums["order_status"];
export type TicketStatus = Enums["ticket_status"];
export type SeatStatus = Enums["seat_status"];
export type SeatingType = Enums["seating_type"];
export type ScanResult = Enums["scan_result"];

/**
 * One row of the search_events() RPC.
 *
 * Written out rather than derived from the generated types: Supabase types
 * every column of a RETURNS TABLE as non-nullable, but several of these are
 * genuinely nullable (an event need not have a venue or a category). The
 * generated row is assignable to this, and other pages that assemble the same
 * shape by hand can be honest about the nulls.
 */
export type EventSearchResult = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  cover_image_url: string | null;
  starts_at: string;
  ends_at: string;
  timezone: string | null;
  is_online: boolean;
  is_featured: boolean;
  city: string;
  country: string;
  venue_name: string | null;
  category_name: string | null;
  category_slug: string | null;
  category_color: string | null;
  organizer_name: string;
  organizer_slug: string;
  min_price_cents: number;
  max_price_cents: number;
  currency: string;
  tickets_left: number;
  is_sold_out: boolean;
  total_count: number;
};
/** One row of the event_availability() RPC. */
export type TicketAvailability = Functions["event_availability"]["Returns"][number];

export type OrganizerStats = {
  gross_cents: number;
  net_cents: number;
  refunded_cents: number;
  platform_fees_cents: number;
  orders_paid: number;
  orders_pending: number;
  currency: string;
  tickets_sold: number;
  tickets_checked_in: number;
  events_total: number;
  events_published: number;
  events_upcoming: number;
};

export type EventStats = {
  gross_cents: number;
  orders: number;
  tickets_sold: number;
  tickets_checked_in: number;
  capacity: number;
  views: number;
  by_ticket_type: {
    name: string;
    sold: number;
    reserved: number;
    total: number;
    price_cents: number;
    gross_cents: number;
  }[];
};

export type PlatformStats = {
  users: number;
  organizers: number;
  events_published: number;
  events_pending: number;
  orders_paid: number;
  tickets_sold: number;
  gross_cents: number;
  platform_fees_cents: number;
};

/** Result of validate_promo_code(). */
export type PromoValidation =
  | { valid: true; promo_code_id: string; code: string; discount_cents: number }
  | { valid: false; message: string };
