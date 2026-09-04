import Link from "next/link";
import { Suspense } from "react";
import { getMyOrganizers, getProfile } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { SearchField } from "./search-field";
import { UserMenu } from "./user-menu";
import { MobileNav } from "./mobile-nav";
import { PRIMARY_NAV } from "./nav-links";

export async function SiteHeader() {
  const [profile, memberships] = await Promise.all([getProfile(), getMyOrganizers()]);

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-paper/85 backdrop-blur-xl supports-[backdrop-filter]:bg-paper/70">
      <div className="container-page">
        <div className="flex h-14 items-center gap-4">
          <div className="flex items-center gap-6">
            <Logo />
            <nav className="hidden items-center gap-1 md:flex">
              {PRIMARY_NAV.slice(0, 3).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="mx-auto hidden w-full max-w-sm lg:block">
            <Suspense fallback={<div className="h-9 rounded-lg bg-sunken" />}>
              <SearchField />
            </Suspense>
          </div>

          <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
            <ThemeToggle />

            {profile ? (
              <>
                <Button asChild variant="soft" size="sm" className="hidden sm:inline-flex">
                  <Link href={memberships.length ? `/dashboard/${memberships[0].organizer.slug}` : "/dashboard/new"}>
                    {memberships.length ? "Dashboard" : "Sell tickets"}
                  </Link>
                </Button>
                <UserMenu profile={profile} memberships={memberships} />
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link href="/auth/login">Sign in</Link>
                </Button>
                <Button asChild variant="primary" size="sm">
                  <Link href="/auth/register">Get started</Link>
                </Button>
              </>
            )}

            <MobileNav
              action={
                profile ? null : (
                  <Button asChild variant="primary" size="lg" block>
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
