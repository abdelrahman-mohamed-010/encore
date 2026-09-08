import type { Metadata } from "next";
import { requireOrganizer } from "@/lib/auth";
import { TeamShell } from "@/components/dashboard/team-manager";
import { TeamRows } from "@/components/dashboard/team-rows";

export const metadata: Metadata = { title: "Team" };

const PAGE_SIZE = 10;

export default async function TeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; role?: string; page?: string }>;
}) {
  const { slug } = await params;
  const { q, role: roleFilter, page: pageParam } = await searchParams;
  const { organizer, role } = await requireOrganizer(slug, "admin");
  const page = Math.max(1, Number(pageParam) || 1);
  const canManageOwners = role === "owner";

  return (
    <TeamShell organizerId={organizer.id} viewerRole={role}>
      <TeamRows
        organizerId={organizer.id}
        canManageOwners={canManageOwners}
        query={q}
        roleFilter={roleFilter}
        page={page}
        pageSize={PAGE_SIZE}
      />
    </TeamShell>
  );
}
