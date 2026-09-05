import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { AdminTabs } from "@/components/admin/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <SiteHeader />

      {/* Hero Page Wash Header matching Account Dashboard */}
      <div className="page-wash -mt-(--size-nav) pt-(--size-nav)">
        <div className="container-page pt-10 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
            <div className="min-w-0">
              <h1 className="display-3 truncate text-ink">Admin Console</h1>
              <p className="mt-1 truncate text-sm text-ink-2">
                Platform operations, event review queues, and user management
              </p>
            </div>

          </div>
        </div>

        <div className="mt-7 border-b border-hairline">
          <div className="container-page">
            <AdminTabs />
          </div>
        </div>
      </div>

      <div className="container-page flex-1 py-8">
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
