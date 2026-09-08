import { UserTableShell } from "@/components/admin/user-table";
import { TableRowsSkeleton } from "@/components/ui/table";

/** See dashboard/[slug]/events/loading.tsx — exists to make this dynamic route prefetchable. */
export default function Loading() {
  return (
    <UserTableShell>
      <TableRowsSkeleton rows={6} columns={5} />
    </UserTableShell>
  );
}
