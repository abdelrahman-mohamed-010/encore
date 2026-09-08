import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const STATIC_ROUTES = ["", "/events", "/categories", "/pricing", "/legal/terms", "/legal/privacy"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [{ data: events }, { data: organizers }, { data: venues }] = await Promise.all([
    supabase
      .from("events")
      .select("slug, updated_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(2000),
    supabase.from("organizers").select("slug, updated_at").limit(1000),
    supabase.from("venues").select("slug, updated_at").eq("is_active", true).limit(1000),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const eventEntries: MetadataRoute.Sitemap = (events ?? []).map((event) => ({
    url: `${siteUrl}/events/${event.slug}`,
    lastModified: event.updated_at ?? undefined,
    changeFrequency: "daily",
    priority: 0.9,
  }));

  const organizerEntries: MetadataRoute.Sitemap = (organizers ?? []).map((organizer) => ({
    url: `${siteUrl}/organizers/${organizer.slug}`,
    lastModified: organizer.updated_at ?? undefined,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const venueEntries: MetadataRoute.Sitemap = (venues ?? []).map((venue) => ({
    url: `${siteUrl}/venues/${venue.slug}`,
    lastModified: venue.updated_at ?? undefined,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticEntries, ...eventEntries, ...organizerEntries, ...venueEntries];
}
