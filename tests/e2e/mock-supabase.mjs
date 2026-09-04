/**
 * A minimal PostgREST-shaped stand-in for Supabase, used by the end-to-end
 * tests. The app under test is pointed at this server, so both the server
 * components and the browser exercise their real code paths — the only thing
 * replaced is the database behind the REST API.
 *
 * It is deliberately small: it answers the queries the public pages actually
 * make, and returns fixtures with the same shapes the real schema produces.
 */
import { createServer } from "node:http";

const now = Date.now();
const days = (n) => new Date(now + n * 86_400_000).toISOString();

export const CATEGORIES = [
  { id: "c1", name: "Music", slug: "music", description: "Concerts and festivals", icon: "music", color: "#8b5cf6", sort_order: 1, is_active: true, created_at: days(-100) },
  { id: "c2", name: "Theatre", slug: "theatre", description: "Plays and opera", icon: "drama", color: "#ec4899", sort_order: 2, is_active: true, created_at: days(-100) },
  { id: "c3", name: "Conference", slug: "conference", description: "Summits and talks", icon: "presentation", color: "#0ea5e9", sort_order: 3, is_active: true, created_at: days(-100) },
];

const searchRow = (over) => ({
  id: "e1", slug: "cairokee-roots-live", title: "Cairokee — Roots Live",
  subtitle: "The full band, one night only.",
  cover_image_url: "https://picsum.photos/seed/cairokee/1200/675",
  starts_at: days(24), ends_at: days(24), timezone: "Africa/Cairo",
  is_online: false, is_featured: true,
  city: "Cairo", country: "EG", venue_name: "Cairo International Stadium",
  category_name: "Music", category_slug: "music", category_color: "#8b5cf6",
  organizer_name: "Cairo Live Nation", organizer_slug: "cairo-live-nation",
  min_price_cents: 4500, max_price_cents: 18000, currency: "USD",
  tickets_left: 2320, is_sold_out: false, total_count: 3,
  ...over,
});

export const SEARCH_EVENTS = [
  searchRow({}),
  searchRow({
    id: "e2", slug: "aida-opening-night", title: "Aida — Opening Night",
    subtitle: "Verdi's Aida, staged where it belongs.",
    cover_image_url: "https://picsum.photos/seed/aidaopera/1200/675",
    starts_at: days(30), ends_at: days(30),
    venue_name: "Cairo Opera House — Main Hall",
    category_name: "Theatre", category_slug: "theatre", category_color: "#ec4899",
    organizer_name: "Nile Arts Collective", organizer_slug: "nile-arts-collective",
    min_price_cents: 9000, max_price_cents: 22000, tickets_left: 468,
  }),
  searchRow({
    id: "e3", slug: "riseup-summit-2026", title: "RiseUp Summit 2026",
    subtitle: "The region's largest gathering for founders.",
    cover_image_url: "https://picsum.photos/seed/riseupsummit/1200/675",
    starts_at: days(38), ends_at: days(40), is_featured: false,
    venue_name: "The Greek Campus",
    category_name: "Conference", category_slug: "conference", category_color: "#0ea5e9",
    min_price_cents: 0, max_price_cents: 45000, tickets_left: 2200,
  }),
];

/**
 * `events_map` rows. Coordinates are the real venues: two a couple of
 * kilometres apart in Cairo and one ~180 km away in Alexandria, so a radius
 * filter has something meaningful to both include and exclude.
 */
const mapRow = (over) => ({
  id: "e1", slug: "cairokee-roots-live", title: "Cairokee — Roots Live",
  starts_at: days(24), ends_at: days(24), timezone: "Africa/Cairo",
  cover_image_url: "https://picsum.photos/seed/cairokee/1200/675",
  is_featured: true,
  venue_name: "Cairo International Stadium", venue_address: "Nasr City, Cairo",
  city: "Cairo", country: "EG",
  latitude: 30.0688, longitude: 31.3122,
  category_name: "Music", category_color: "#8b5cf6",
  organizer_name: "Cairo Live Nation", organizer_slug: "cairo-live-nation",
  min_price_cents: 4500, currency: "USD", is_sold_out: false,
  distance_km: null,
  ...over,
});

export const EVENTS_MAP = [
  mapRow({}),
  mapRow({
    id: "e2", slug: "aida-opening-night", title: "Aida — Opening Night",
    cover_image_url: "https://picsum.photos/seed/aidaopera/1200/675",
    starts_at: days(30), ends_at: days(30),
    venue_name: "Cairo Opera House — Main Hall", venue_address: "Gezira, Cairo",
    latitude: 30.0426, longitude: 31.2247,
    category_name: "Theatre", category_color: "#ec4899",
    organizer_name: "Nile Arts Collective", organizer_slug: "nile-arts-collective",
    min_price_cents: 9000,
  }),
  mapRow({
    id: "e3", slug: "riseup-summit-2026", title: "RiseUp Summit 2026",
    cover_image_url: "https://picsum.photos/seed/riseupsummit/1200/675",
    starts_at: days(38), ends_at: days(40), is_featured: false,
    venue_name: "Bibliotheca Alexandrina", venue_address: "Chatby, Alexandria",
    city: "Alexandria", latitude: 31.2089, longitude: 29.9092,
    category_name: "Conference", category_color: "#0ea5e9",
    min_price_cents: 0,
  }),
];

export const EVENT_DETAIL = {
  id: "e1", organizer_id: "o1", category_id: "c1", venue_id: "v1",
  title: "Cairokee — Roots Live", slug: "cairokee-roots-live",
  subtitle: "The full band, one night only.",
  description: "Cairokee return to Cairo International Stadium for the closing night of the Roots tour.\nExpect the full catalogue and a stage built for this venue.",
  cover_image_url: "https://picsum.photos/seed/cairokee/1200/675",
  gallery: [], status: "published", visibility: "public", seating_type: "general_admission",
  starts_at: days(24), ends_at: days(24), doors_open_at: null, timezone: "Africa/Cairo",
  is_online: false, online_url: null, sales_start_at: null, sales_end_at: null,
  capacity: null, min_age: 16, tags: ["rock", "live"],
  refund_policy: "Full refunds up to 7 days before the event.", terms: null,
  is_featured: true, view_count: 412, published_at: days(-20),
  cancelled_at: null, cancellation_reason: null, rejection_reason: null,
  search_vector: null, created_at: days(-30), updated_at: days(-20),
  organizer: { id: "o1", name: "Cairo Live Nation", slug: "cairo-live-nation", logo_url: null, description: "Egypt's biggest promoter of live music.", verification_status: "verified" },
  venue: { id: "v1", name: "Cairo International Stadium", slug: "cairo-international-stadium", address_line1: "Nasr City", city: "Cairo", country: "EG", timezone: "Africa/Cairo", latitude: 30.0688, longitude: 31.3122, image_url: null },
  category: { id: "c1", name: "Music", slug: "music", color: "#8b5cf6" },
};

export const AVAILABILITY = [
  { ticket_type_id: "t1", name: "General Admission", price_cents: 4500, currency: "USD", available: 1820, quantity_total: 2000, min_per_order: 1, max_per_order: 8, on_sale: true },
  { ticket_type_id: "t2", name: "Golden Circle", price_cents: 9500, currency: "USD", available: 6, quantity_total: 400, min_per_order: 1, max_per_order: 6, on_sale: true },
  { ticket_type_id: "t3", name: "VIP Lounge", price_cents: 18000, currency: "USD", available: 0, quantity_total: 120, min_per_order: 1, max_per_order: 0, on_sale: true },
];

const ORGANIZERS = [
  { id: "o1", owner_id: "u1", name: "Cairo Live Nation", slug: "cairo-live-nation", description: "Egypt's biggest promoter of live music.", logo_url: null, banner_url: null, website: "https://cairolivenation.example", support_email: "hello@cairolivenation.example", support_phone: null, country: "EG", social_links: {}, verification_status: "verified", is_suspended: false, created_at: days(-200), updated_at: days(-10), events: [{ count: 6 }] },
  { id: "o2", owner_id: "u2", name: "Nile Arts Collective", slug: "nile-arts-collective", description: "Independent theatre and classical performance.", logo_url: null, banner_url: null, website: null, support_email: null, support_phone: null, country: "EG", social_links: {}, verification_status: "verified", is_suspended: false, created_at: days(-180), updated_at: days(-10), events: [{ count: 3 }] },
];

const PLATFORM_SETTINGS = {
  id: true, platform_name: "Tazkarti", support_email: "support@tazkarti.app",
  default_currency: "USD", platform_fee_percent: 5, platform_fee_fixed_cents: 99,
  require_event_approval: true, hold_duration_minutes: 10, updated_at: days(-1),
};

const VENUES = [
  { id: "v1", city: "Cairo", name: "Cairo International Stadium", country: "EG" },
  { id: "v2", city: "Marsa Matrouh", name: "Sahel Beach Arena", country: "EG" },
];

function json(res, body, status = 200, headers = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Expose-Headers": "content-range",
    "Content-Range": "0-0/*",
    ...headers,
  });
  res.end(payload);
}

/** PostgREST returns a bare object (not an array) when asked for one. */
function respond(req, res, rows) {
  const wantsObject = (req.headers.accept ?? "").includes("pgrst.object");
  if (wantsObject) return json(res, Array.isArray(rows) ? (rows[0] ?? null) : rows);
  return json(res, Array.isArray(rows) ? rows : [rows]);
}

function eqValue(params, key) {
  const raw = params.get(key);
  return raw?.startsWith("eq.") ? raw.slice(3) : undefined;
}

export function createMockSupabase(port = 54321) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    const { pathname, searchParams } = url;

    if (req.method === "OPTIONS") return json(res, {});

    let body = {};
    if (req.method === "POST") {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString() || "{}";
      try { body = JSON.parse(raw); } catch { body = {}; }
    }

    // ---- Auth: nobody is signed in during these tests --------------------
    if (pathname.startsWith("/auth/v1/user")) {
      return json(res, { error: "invalid_token", error_description: "no session" }, 401);
    }
    if (pathname.startsWith("/auth/v1/token")) {
      return json(
        res,
        { error: "invalid_grant", error_description: "Invalid login credentials" },
        400,
      );
    }
    if (pathname.startsWith("/auth/v1/")) return json(res, {});

    // ---- RPCs -------------------------------------------------------------
    if (pathname === "/rest/v1/rpc/search_events") {
      let rows = SEARCH_EVENTS;
      if (body.p_featured_only) rows = rows.filter((r) => r.is_featured);
      if (body.p_category_slug) rows = rows.filter((r) => r.category_slug === body.p_category_slug);
      if (body.p_free_only) rows = rows.filter((r) => r.min_price_cents === 0);
      if (body.p_organizer_slug) rows = rows.filter((r) => r.organizer_slug === body.p_organizer_slug);
      if (body.p_query) {
        const q = String(body.p_query).toLowerCase();
        rows = rows.filter((r) => r.title.toLowerCase().includes(q));
      }
      if (body.p_sort === "price_low") {
        rows = [...rows].sort((a, b) => a.min_price_cents - b.min_price_cents);
      }
      rows = rows.map((r) => ({ ...r, total_count: rows.length }));
      return json(res, rows.slice(0, body.p_limit ?? 24));
    }

    if (pathname === "/rest/v1/rpc/events_map") {
      let rows = EVENTS_MAP;
      if (body.p_organizer_slug) {
        rows = rows.filter((r) => r.organizer_slug === body.p_organizer_slug);
      }
      if (body.p_city) {
        rows = rows.filter((r) => r.city.toLowerCase() === String(body.p_city).toLowerCase());
      }

      // Mirror the real function: compute distance whenever a point is given,
      // and only filter when a radius is given too.
      if (body.p_lat != null && body.p_lng != null) {
        const R = 6371;
        const rad = (d) => (d * Math.PI) / 180;
        rows = rows.map((r) => {
          const dLat = rad(r.latitude - body.p_lat);
          const dLng = rad(r.longitude - body.p_lng);
          const h =
            Math.sin(dLat / 2) ** 2 +
            Math.sin(dLng / 2) ** 2 * Math.cos(rad(body.p_lat)) * Math.cos(rad(r.latitude));
          return { ...r, distance_km: 2 * R * Math.asin(Math.sqrt(h)) };
        });
        if (body.p_radius_km != null) {
          rows = rows.filter((r) => r.distance_km <= body.p_radius_km);
        }
        rows = [...rows].sort((a, b) => a.distance_km - b.distance_km);
      }

      return json(res, rows.slice(0, body.p_limit ?? 200));
    }

    if (pathname === "/rest/v1/rpc/event_availability") return json(res, AVAILABILITY);
    if (pathname === "/rest/v1/rpc/increment_event_views") return json(res, null);
    if (pathname === "/rest/v1/rpc/validate_promo_code") {
      const code = String(body.p_code ?? "").toUpperCase();
      if (code === "CAIRO20") {
        return json(res, {
          valid: true, promo_code_id: "p1", code: "CAIRO20",
          discount_cents: Math.floor((body.p_subtotal_cents ?? 0) * 0.2),
          discount_type: "percentage", discount_value: 20,
        });
      }
      return json(res, { valid: false, message: "That promo code is not valid for this event." });
    }

    // ---- Tables -----------------------------------------------------------
    if (pathname === "/rest/v1/categories") {
      const slug = eqValue(searchParams, "slug");
      const rows = slug ? CATEGORIES.filter((c) => c.slug === slug) : CATEGORIES;
      return respond(req, res, rows.map((c) => ({ ...c, events: [{ count: 4 }] })));
    }

    if (pathname === "/rest/v1/events") {
      const slug = eqValue(searchParams, "slug");
      if (slug) return respond(req, res, slug === EVENT_DETAIL.slug ? [EVENT_DETAIL] : []);
      return respond(req, res, []);
    }

    if (pathname === "/rest/v1/organizers") {
      const slug = eqValue(searchParams, "slug");
      const rows = slug ? ORGANIZERS.filter((o) => o.slug === slug) : ORGANIZERS;
      return respond(req, res, rows);
    }

    if (pathname === "/rest/v1/platform_settings") return respond(req, res, [PLATFORM_SETTINGS]);
    if (pathname === "/rest/v1/venues") return respond(req, res, VENUES);
    if (pathname === "/rest/v1/event_seats") return respond(req, res, []);

    // Anything else an anonymous visitor touches is legitimately empty.
    return respond(req, res, []);
  });

  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

if (process.argv[1]?.endsWith("mock-supabase.mjs")) {
  const port = Number(process.env.MOCK_PORT ?? 54321);
  await createMockSupabase(port);
  console.log(`mock supabase listening on http://127.0.0.1:${port}`);
}
