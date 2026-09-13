import type { EventStatus } from "@/lib/types";

/**
 * Query DTOs with no server dependency, so a client chart can name the shape
 * it renders without importing the server-only module that produces it.
 */
export type SalesPoint = { day: string; gross_cents: number; orders: number; tickets: number };

export type RecentEvent = {
  id: string;
  title: string;
  slug: string;
  status: EventStatus;
  starts_at: string;
  cover_image_url: string | null;
};
