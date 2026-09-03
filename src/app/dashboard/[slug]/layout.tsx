import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { requireOrganizer, getMyOrganizers } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { OrganizerSwitcher } from "@/components/dashboard/organizer-switcher";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [{ organizer, role }, memberships] = await Promise.all([
    requireOrganizer(slug),
    getMyOrganizers(),
  ]);

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="sticky top-0 z-30 border-b border-hairline bg-paper/85 backdrop-blur-xl">
        <div className="container-page flex h-14 items-center gap-3">
          <Logo showWordmark={false} />
          <OrganizerSwitcher current={organizer} memberships={memberships} />
          <Badge tone="neutral" size="xs" className="hidden sm:inline-flex">{role}</Badge>

          <div className="ml-auto flex items-center gap-1.5">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/organizers/${organizer.slug}`} target="_blank">
                Public page <ExternalLink />
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container-page flex flex-1 gap-8 py-8">
        <aside className="hidden w-52 shrink-0 lg:block">
          <div className="sticky top-24">
            <DashboardSidebar slug={organizer.slug} role={role} />
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
