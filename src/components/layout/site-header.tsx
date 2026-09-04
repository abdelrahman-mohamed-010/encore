import Link from "next/link";
import { Suspense } from "react";
import { getMyOrganizers, getProfile } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { SearchField } from "./search-field";
import { PrimaryNav } from "./primary-nav";
import { UserMenu } from "./user-menu";
import { MobileNav } from "./mobile-nav";

export async function SiteHeader() {
  const [profile, memberships] = await Promise.all([getProfile(), getMyOrganizers()]);

  return (
    <header className="relative z-40 bg-transparent">
      <div className="container-page">
        {/*
          Three tracks rather than a flex row: the outer columns are always
          equal, so the nav stays optically centred on the page even as the
          right-hand group changes width between signed-out, signed-in and
          organizer states. The `max-content` floor is what keeps that from
          squeezing the wider side — with a plain `1fr` the two columns split
          the leftover space evenly and the actions wrap.
        */}
        <div className="grid h-(--size-nav) grid-cols-[auto_1fr] items-center gap-4 md:grid-cols-[minmax(max-content,1fr)_auto_minmax(max-content,1fr)]">
          <div className="flex min-w-0 items-center">
            <Logo />
          </div>

          <PrimaryNav className="hidden md:flex" />

          <div className="flex items-center justify-end gap-3 whitespace-nowrap lg:gap-5">
            <Suspense fallback={<div className="hidden h-9 w-56 rounded-md bg-sunken xl:block" />}>
              <SearchField className="hidden w-56 xl:block" size="sm" placeholder="Search events" />
            </Suspense>

            {profile ? (
              <>
                <Link
                  href={memberships.length ? `/dashboard/${memberships[0].organizer.slug}` : "/dashboard/new"}
                  className="hidden text-md font-medium text-ink transition-colors hover:text-ink-2 sm:inline"
                >
                  {memberships.length ? "Dashboard" : "Sell tickets"}
                </Link>
                <ThemeToggle />
                <UserMenu profile={profile} memberships={memberships} />
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="hidden text-md font-medium text-ink-2 transition-colors hover:text-ink sm:inline"
                >
                  Sign in
                </Link>
                <ThemeToggle />
                <Button asChild variant="solid" size="sm">
                  <Link href="/auth/register">Get started</Link>
                </Button>
              </>
            )}

            <MobileNav
              action={
                profile ? null : (
                  <Button asChild variant="solid" size="lg" block>
                    <Link href="/auth/register">Get started</Link>
                  </Button>
                )
              }
            />
          </div>
        </div>
      </div>
    </header>
  );
}
