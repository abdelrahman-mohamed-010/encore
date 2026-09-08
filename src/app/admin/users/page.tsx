import type { Metadata } from "next";
import { SectionHeader } from "@/components/ui/surface";
import { UserTableShell } from "@/components/admin/user-table";
import { UserRows } from "@/components/admin/user-table-rows";

export const metadata: Metadata = { title: "Users" };

const PAGE_SIZE = 10;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  return (
    <div className="space-y-6">
      <SectionHeader level={1} title="Users" description="Everyone with an Encore account." />
      <UserTableShell>
        <UserRows query={q} page={page} pageSize={PAGE_SIZE} />
      </UserTableShell>
    </div>
  );
}
