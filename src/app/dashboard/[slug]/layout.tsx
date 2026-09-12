import { Plus } from "lucide-react";
import { requireOrganizer, getMyOrganizers, getProfile } from "@/lib/auth";
import { SessionProvider } from "@/contexts";
import { SiteHeader } from "@/components/layout/site-header";
import { ReportDownload } from "@/components/dashboard/report-download";
import { OrganizerSwitcher } from "@/components/dashboard/organizer-switcher";
import { DashboardTabs } from "@/components/dashboard/dashboard-nav";
import { EventFormDrawer } from "@/components/dashboard/event-form-drawer";
import { Avatar } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";

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
      <div className="flex min-h-dvh flex-col bg-paper">
        <SiteHeader />

        {/* Hero Page Wash Header matching Admin Console and Account */}
        <div className="page-wash -mt-(--size-nav) pt-(--size-nav)">
          <div className="container-page pt-10 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
              <div className="flex min-w-0 items-center gap-4">
                <Avatar
                  src={organizer.logo_url}
                  name={organizer.name}
                  size="xl"
                  className="rounded-2xl"
                />
                <div className="min-w-0">
                  <OrganizerSwitcher current={organizer} memberships={memberships} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* organizer_stats refuses anyone below staff, so a scanner
                    would only ever get an error from this. */}
                {canCreate && <ReportDownload slug={organizer.slug} />}
                {canCreate && (
                  <EventFormDrawer
                    organizerId={organizer.id}
                    organizerSlug={organizer.slug}
                    trigger={
                      <Button variant="solid" size="md">
                        <Plus /> New event
                      </Button>
                    }
                  />
                )}
              </div>
            </div>
          </div>

          <div className="mt-7 border-b border-hairline">
            <div className="container-page">
              <DashboardTabs slug={organizer.slug} role={role} />
            </div>
          </div>
        </div>

        <div className="container-page flex-1 py-8">
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
