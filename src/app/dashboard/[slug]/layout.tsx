import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import { requireOrganizer, getMyOrganizers, getProfile } from "@/lib/auth";
import { SessionProvider } from "@/contexts";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardMobileNav } from "@/components/dashboard/mobile-nav";
import { OrganizerSwitcher } from "@/components/dashboard/organizer-switcher";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * A true app shell: the sidebar is a fixed full-height column and only the
 * main pane scrolls. The previous layout put the nav inside the content
 * column, so it scrolled away with the page and the dashboard read as a
 * marketing page with links down one side rather than as a tool.
 */
export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [{ organizer, role }, memberships, profile] = await Promise.all([
    requireOrganizer(slug),
    getMyOrganizers(),
    getProfile(),
  ]);

  const canCreate = role === "owner" || role === "admin" || role === "staff";

  return (
    <SessionProvider profile={profile} memberships={memberships}>
      <div className="min-h-dvh bg-paper lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-dvh flex-col border-r border-hairline bg-paper lg:flex">
          <div className="flex h-(--size-nav) shrink-0 items-center px-4">
            <Logo />
          </div>

          <div className="px-3 pb-4">
            <OrganizerSwitcher current={organizer} memberships={memberships} />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
            <DashboardSidebar slug={organizer.slug} role={role} />
          </div>

          <div className="shrink-0 border-t border-hairline p-3">
            <Button asChild variant="soft" size="sm" block>
              <Link href={`/organizers/${organizer.slug}`} target="_blank">
                Public page <ExternalLink />
              </Link>
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-30 border-b border-hairline bg-paper/85 backdrop-blur-xl">
            <div className="flex h-(--size-nav) items-center gap-3 px-5 md:px-8">
              <DashboardMobileNav slug={organizer.slug} role={role} name={organizer.name} />
              <Badge tone="neutral" size="xs" className="hidden sm:inline-flex">
                {role}
              </Badge>

              <div className="ml-auto flex items-center gap-3">
                {canCreate && (
                  <Button asChild variant="solid" size="sm">
                    <Link href={`/dashboard/${organizer.slug}/events/new`}>
                      <Plus /> New event
                    </Link>
                  </Button>
                )}
                <ThemeToggle />
                {profile && <UserMenu profile={profile} memberships={memberships} />}
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
