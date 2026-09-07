import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireOrganizer } from "@/lib/auth";
import { PromoShell } from "@/components/dashboard/promo-manager";

export const metadata: Metadata = { title: "Promo codes" };

export default async function PromosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { organizer } = await requireOrganizer(slug, "staff");
  const supabase = await createClient();

  // The events lookup feeds the "New code" dialog's combobox, so it's
  // awaited — the promo list itself is what streams in behind the shell.
  const { data: events } = await supabase
    .from("events")
    .select("id, title")
    .eq("organizer_id", organizer.id)
    .order("starts_at", { ascending: false });

  const promosPromise = supabase
    .from("promo_codes")
    .select("*")
    .eq("organizer_id", organizer.id)
    .order("created_at", { ascending: false })
    .then(({ data }) => data ?? []);

  return (
    <PromoShell organizerId={organizer.id} promosPromise={promosPromise} events={events ?? []} />
  );
}
