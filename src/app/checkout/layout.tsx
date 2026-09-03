import Link from "next/link";
import { Lock } from "lucide-react";
import { Logo } from "@/components/logo";

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="border-b border-hairline bg-card">
        <div className="container-page flex h-14 items-center justify-between">
          <Logo />
          <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-3">
            <Lock className="size-3.5" />
            Secure checkout
          </span>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-hairline">
        <div className="container-page flex h-14 items-center justify-center gap-5 text-[12.5px] text-ink-3">
          <Link href="/legal/terms" className="transition-colors hover:text-ink-2">Terms</Link>
          <Link href="/legal/privacy" className="transition-colors hover:text-ink-2">Privacy</Link>
        </div>
      </footer>
    </div>
  );
}
