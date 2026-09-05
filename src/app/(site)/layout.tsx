import { getMyOrganizers, getProfile } from "@/lib/auth";
import { SessionProvider } from "@/contexts";
import { SiteHeader } from "@/components/layout/site-header";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // Resolved once here and shared through context. Both are memoised per
  // request, so the header below reuses this work rather than querying again.
  const [profile, memberships] = await Promise.all([getProfile(), getMyOrganizers()]);

  return (
    <SessionProvider profile={profile} memberships={memberships}>
      <div className="relative flex min-h-dvh flex-col">
        {/* Soft top wash gradient present across all site pages */}
        <div aria-hidden className="page-wash pointer-events-none absolute inset-x-0 top-0 h-[440px]" />
        <SiteHeader />
        <main className="relative z-10 flex-1">{children}</main>
      </div>
    </SessionProvider>
  );
}
