import Link from "next/link";
import { requireProfile } from "@/lib/auth";

import { Avatar } from "@/components/ui/avatar";import { Button } from "@/components/ui/button";
import { AccountTabs } from "@/components/ui/tab-nav";

/**
 * The account area gets the same header treatment as the dashboard: a washed
 * identity block that fades into the page, closed by a tab rule. The rule
 * spans the full width while the tabs sit on the content column, so the
 * sections read as one surface rather than four separate pages.
 */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();

  return (
    <>
      <div className="page-wash -mt-(--size-nav) pt-(--size-nav)">
        <div className="container-page pt-10">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
            <div className="flex min-w-0 items-center gap-4">
              <Avatar
                src={profile.avatar_url}
                name={profile.full_name ?? profile.email}
                size="xl"
              />
              <div className="min-w-0">
                <h1 className="display-3 truncate text-ink">
                  {profile.full_name ?? "Your account"}
                </h1>
                <p className="mt-1 truncate text-base text-ink-2">{profile.email}</p>
              </div>
            </div>

            <Button asChild variant="soft" size="md">
              <Link href="/events">Find something to do</Link>
            </Button>
          </div>
        </div>

        <div className="mt-7 border-b border-hairline">
          <div className="container-page">
            <AccountTabs />
          </div>
        </div>
      </div>

      <div className="container-page py-8">{children}</div>
    </>
  );
}
