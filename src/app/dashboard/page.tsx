import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Building2, Plus } from "lucide-react";
import { getMyOrganizers, requireUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { EmptyState, Avatar } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardIndex() {
  await requireUser();
  const memberships = await getMyOrganizers();

  // A single tenant needs no chooser.
  if (memberships.length === 1) redirect(`/dashboard/${memberships[0].organizer.slug}`);

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="display-2 text-ink">Your organizations</h1>
        <p className="mt-2 text-[15px] text-ink-2">
          Each organization has its own events, team, payouts and sales.
        </p>

        {memberships.length === 0 ? (
          <EmptyState
            className="mt-8"
            icon={Building2}
            title="You are not part of an organization yet"
            description="Create one to start publishing events and selling tickets."
            action={
              <Button asChild variant="solid" size="md">
                <Link href="/dashboard/new"><Plus /> Create an organization</Link>
              </Button>
            }
          />
        ) : (
          <>
            <div className="mt-8 overflow-hidden rounded-xl border border-hairline bg-card">
              {memberships.map(({ organizer, role }) => (
                <Link
                  key={organizer.id}
                  href={`/dashboard/${organizer.slug}`}
                  className="flex items-center gap-3.5 border-b border-hairline-soft px-4 py-4 transition-colors last:border-b-0 hover:bg-sunken"
                >
                  <Avatar src={organizer.logo_url} name={organizer.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-semibold text-ink">{organizer.name}</p>
                    <p className="truncate text-[12.5px] text-ink-3">/{organizer.slug}</p>
                  </div>
                  <Badge tone="neutral" size="xs">{role}</Badge>
                </Link>
              ))}
            </div>

            <Button asChild variant="outline" size="md" className="mt-4">
              <Link href="/dashboard/new"><Plus /> New organization</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
