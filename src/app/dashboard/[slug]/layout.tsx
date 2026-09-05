import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import { requireOrganizer, getMyOrganizers, getProfile } from "@/lib/auth";
import { SessionProvider } from "@/contexts";
import { SiteHeader } from "@/components/layout/site-header";
import { OrganizerSwitcher } from "@/components/dashboard/organizer-switcher";
import { DashboardTabs } from "@/components/dashboard/dashboard-nav";
import { Avatar } from "@/components/ui/misc";
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
                  <div className="flex items-center gap-2.5">
                    <h1 className="display-3 truncate text-ink">{organizer.name}</h1>
                    <Badge tone="neutral" size="xs">
                      {role}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate text-sm text-ink-3">
                    /{organizer.slug}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <OrganizerSwitcher current={organizer} memberships={memberships} />
                <Button asChild variant="outline" size="md">
                  <Link href={`/organizers/${organizer.slug}`} target="_blank">
                    <ExternalLink /> Public page
                  </Link>
                </Button>
                {canCreate && (
                  <Button asChild variant="solid" size="md">
                    <Link href={`/dashboard/${organizer.slug}/events/new`}>
                      <Plus /> New event
                    </Link>
                  </Button>
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
