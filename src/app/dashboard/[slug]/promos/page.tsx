import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireOrganizer } from "@/lib/auth";
import { PromoManager } from "@/components/dashboard/promo-manager";

export const metadata: Metadata = { title: "Promo codes" };

export default async function PromosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { organizer } = await requireOrganizer(slug, "staff");
  const supabase = await createClient();

  const [{ data: promos }, { data: events }] = await Promise.all([
    supabase
      .from("promo_codes")
      .select("*")
      .eq("organizer_id", organizer.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("events")
      .select("id, title")
      .eq("organizer_id", organizer.id)
      .order("starts_at", { ascending: false }),
  ]);

  return (
    <PromoManager
      organizerId={organizer.id}
      promos={promos ?? []}
      events={events ?? []}
    />
  );
}
