import { SiteHeader } from "@/components/layout/site-header";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <div aria-hidden className="page-wash pointer-events-none absolute inset-x-0 top-0 h-[440px]" />
      <SiteHeader />
      <main className="relative z-10 flex-1">{children}</main>
    </div>
  );
}
