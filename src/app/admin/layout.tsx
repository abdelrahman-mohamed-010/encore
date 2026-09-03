import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="sticky top-0 z-30 border-b border-hairline bg-paper/85 backdrop-blur-xl">
        <div className="container-page flex h-14 items-center gap-3">
          <Logo showWordmark={false} />
          <span className="text-[14px] font-semibold text-ink">Admin</span>
          <Badge tone="critical" size="xs">Platform</Badge>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/"
              className="text-[13px] text-ink-3 transition-colors hover:text-ink"
            >
              Back to site
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container-page flex flex-1 gap-8 py-8">
        <aside className="hidden w-48 shrink-0 lg:block">
          <div className="sticky top-24">
            <AdminNav />
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
