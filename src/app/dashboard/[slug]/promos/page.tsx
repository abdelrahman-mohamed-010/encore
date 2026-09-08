import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireOrganizer } from "@/lib/auth";
import { PromoShell } from "@/components/dashboard/promo-manager";
import { PromoRows } from "@/components/dashboard/promo-rows";

export const metadata: Metadata = { title: "Promo codes" };

const PAGE_SIZE = 10;

export default async function PromosPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { slug } = await params;
  const { q, page: pageParam } = await searchParams;
  const { organizer } = await requireOrganizer(slug, "staff");
  const supabase = await createClient();
  const page = Math.max(1, Number(pageParam) || 1);

  // The events lookup feeds the "New code" dialog's combobox, so it's
  // awaited — the promo list itself is what streams in behind the shell.
  const { data: events } = await supabase
    .from("events")
    .select("id, title")
    .eq("organizer_id", organizer.id)
    .order("starts_at", { ascending: false });

  return (
    <PromoShell organizerId={organizer.id} events={events ?? []}>
      <PromoRows organizerId={organizer.id} query={q} page={page} pageSize={PAGE_SIZE} />
    </PromoShell>
  );
}
