import { getMyOrganizers, getProfile } from "@/lib/auth";
import { SessionProvider } from "@/contexts";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // Resolved once here and shared through context. Both are memoised per
  // request, so the header below reuses this work rather than querying again.
  const [profile, memberships] = await Promise.all([getProfile(), getMyOrganizers()]);

  return (
    <SessionProvider profile={profile} memberships={memberships}>
      <div className="flex min-h-dvh flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </SessionProvider>
  );
}
