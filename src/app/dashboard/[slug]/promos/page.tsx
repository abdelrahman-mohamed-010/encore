import type { Metadata } from "next";
import { requireOrganizer } from "@/lib/auth";
import { listPromoEventOptions } from "@/features/promos/queries";
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
  const page = Math.max(1, Number(pageParam) || 1);

  // The events lookup feeds the "New code" dialog's combobox, so it's
  // awaited — the promo list itself is what streams in behind the shell.
  const events = await listPromoEventOptions(organizer.id);

  return (
    <PromoShell organizerSlug={organizer.slug} events={events}>
      <PromoRows
        organizerId={organizer.id}
        organizerSlug={organizer.slug}
        query={q}
        page={page}
        pageSize={PAGE_SIZE}
      />
    </PromoShell>
  );
}
