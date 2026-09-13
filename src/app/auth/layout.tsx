import Link from "next/link";
import { Ticket, Timer, Wallet } from "lucide-react";
import { BackLink } from "@/components/ui/back-link";
import { Logo } from "@/components/logo";

const PROOF = [
  { icon: Ticket, text: "Every ticket you buy lives in your account, QR ready at the door." },
  { icon: Timer, text: "Your seats are held for ten minutes while you check out." },
  { icon: Wallet, text: "Host your own events and take card payments through Stripe." },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-paper lg:grid-cols-2">
      {/* ---- Form side ---------------------------------------------------- */}
      <div className="relative flex min-h-dvh flex-col lg:min-h-0">
        {/*
          The rest of the product opens on a wash that fades into the page, so
          auth does too — it replaces the hard rule this header used to carry.
        */}
        <div
          aria-hidden
          className="page-wash pointer-events-none absolute inset-x-0 top-0 h-64 lg:hidden"
        />

        <header className="relative z-10 flex items-center justify-between px-5 py-5 md:px-10">
          <Logo showWordmark />
          <BackLink href="/">Back to events</BackLink>
        </header>

        <main className="relative z-10 flex flex-1 items-center px-5 py-10 md:px-10">
          <div className="mx-auto w-full max-w-[25rem]">{children}</div>
        </main>

        <footer className="relative z-10 flex items-center justify-center gap-5 px-5 py-6 text-xs text-ink-3 md:px-10">
          <Link href="/legal/terms" className="transition-colors hover:text-ink-2">Terms</Link>
          <Link href="/legal/privacy" className="transition-colors hover:text-ink-2">Privacy</Link>
        </footer>
      </div>

      {/* ---- Brand side --------------------------------------------------- */}
      <aside className="relative hidden overflow-hidden bg-wash-2 lg:flex lg:flex-col lg:justify-center">
        <div aria-hidden className="page-wash pointer-events-none absolute inset-0" />
        <div aria-hidden className="dot-field-column pointer-events-none absolute inset-0" />

        <div className="relative z-10 mx-auto w-full max-w-[26rem] px-10">
          <p className="eyebrow">Encore</p>
          <p className="display-2 mt-4 font-flourish text-ink">
            Find your next
            <br />
            night out.
          </p>

          <ul className="mt-10 space-y-5">
            {PROOF.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-card/70 text-ink-2 shadow-e1">
                  <Icon className="size-4" />
                </span>
                <p className="pt-1.5 text-sm leading-relaxed text-ink-2">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
