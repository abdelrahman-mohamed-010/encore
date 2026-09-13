import Link from "next/link";
import { BackLink } from "@/components/ui/back-link";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="border-b border-hairline">
        <div className="container-page flex h-14 items-center justify-between">
          <Logo />
          <BackLink href="/">
            Back to events
          </BackLink>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-[25rem]">{children}</div>
      </main>

      <footer className="border-t border-hairline">
        <div className="container-page flex h-14 items-center justify-center gap-5 text-xs text-ink-3">
          <Link href="/legal/terms" className="transition-colors hover:text-ink-2">Terms</Link>
          <Link href="/legal/privacy" className="transition-colors hover:text-ink-2">Privacy</Link>
        </div>
      </footer>
    </div>
  );
}
