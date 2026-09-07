import { createClient } from "@supabase/supabase-js";
import { buildReport, money, type ReportInput, type SeriesPoint } from "./report.ts";

/**
 * Sales report for one organizer, as a PDF.
 *
 * The caller's own access token is forwarded to PostgREST, so this function
 * grants nothing: `organizer_stats` already refuses anyone who is not staff on
 * the organizer, and RLS scopes every other read. There is no service-role key
 * here on purpose — a report endpoint should not be able to see more than the
 * person asking for it.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function fail(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return fail("Use POST.", 405);

  const authorization = req.headers.get("Authorization");
  if (!authorization) return fail("Sign in to download a report.", 401);

  let slug: string;
  try {
    ({ slug } = await req.json());
  } catch {
    return fail("Expected a JSON body with an organizer slug.", 400);
  }
  if (!slug) return fail("Which organizer?", 400);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authorization } } },
  );

  const { data: organizer } = await supabase
    .from("organizers")
    .select("id, name")
    .eq("slug", slug)
    .maybeSingle();

  if (!organizer) return fail("That organizer does not exist.", 404);

  // Raises 42501 for anyone who is not staff, which is the authorization check.
  const { data: stats, error: statsError } = await supabase.rpc("organizer_stats", {
    p_organizer_id: organizer.id,
  });
  if (statsError) return fail("You do not have access to this organizer's figures.", 403);

  const [{ data: events }, { data: tickets }, { data: series }] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, status, starts_at, timezone")
      .eq("organizer_id", organizer.id)
      .order("starts_at", { ascending: false }),
    supabase
      .from("tickets")
      .select("event_id, status")
      .in("status", ["valid", "used"]),
    // The same fourteen-day window the dashboard charts, so the printed report
    // and the screen never disagree.
    supabase.rpc("organizer_sales_series", { p_organizer_id: organizer.id, p_days: 14 }),
  ]);

  // Tallied here rather than in SQL: the volumes are small, and it avoids
  // adding an RPC that exists only to serve this one document.
  const sold = new Map<string, number>();
  const attended = new Map<string, number>();
  for (const ticket of tickets ?? []) {
    sold.set(ticket.event_id, (sold.get(ticket.event_id) ?? 0) + 1);
    if (ticket.status === "used") {
      attended.set(ticket.event_id, (attended.get(ticket.event_id) ?? 0) + 1);
    }
  }

  const figures = stats as Record<string, number | string>;
  const currency = String(figures.currency ?? "USD");

  const input: ReportInput = {
    organizerName: organizer.name,
    generatedAt: new Date(),
    currency,
    // The dashboard's own four tiles, label, figure and sub-line alike.
    tiles: [
      {
        label: "Gross revenue",
        value: money(Number(figures.gross_cents ?? 0), currency),
        sub: `${figures.orders_paid ?? 0} paid orders`,
      },
      {
        label: "Net to you",
        value: money(Number(figures.net_cents ?? 0), currency),
        sub: `after ${money(Number(figures.platform_fees_cents ?? 0), currency)} fees`,
      },
      {
        label: "Tickets sold",
        value: String(figures.tickets_sold ?? 0),
        sub: `${figures.tickets_checked_in ?? 0} checked in`,
      },
      {
        label: "Published events",
        value: String(figures.events_published ?? 0),
        sub: `${figures.events_upcoming ?? 0} upcoming`,
      },
    ],
    series: ((series ?? []) as { day: string; gross_cents: number; tickets: number }[]).map(
      (point): SeriesPoint => ({
        day: point.day,
        grossCents: Number(point.gross_cents ?? 0),
        tickets: Number(point.tickets ?? 0),
      }),
    ),
    events: (events ?? []).map((event) => ({
      title: event.title,
      date: new Date(event.starts_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      status: event.status,
      sold: sold.get(event.id) ?? 0,
      attended: attended.get(event.id) ?? 0,
    })),
  };

  const pdf = await buildReport(input);
  const filename = `${slug}-report-${new Date().toISOString().slice(0, 10)}.pdf`;

  return new Response(pdf, {
    headers: {
      ...CORS,
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
});
