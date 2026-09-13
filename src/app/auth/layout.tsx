import Link from "next/link";
import { BackLink } from "@/components/ui/back-link";
import { Logo } from "@/components/logo";

const PROOF = [
  "Every ticket you buy lives in your account, QR ready at the door.",
  "Your seats are held for ten minutes while you check out.",
  "Host your own events and take card payments through Stripe.",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-paper lg:h-dvh lg:grid-cols-2">
      {/* ---- Form side ---------------------------------------------------- */}
      <div className="relative flex min-h-dvh flex-col lg:h-full lg:min-h-0">
        {/*
          The rest of the product opens on a wash that fades into the page, so
          auth does too — it replaces the hard rule this header used to carry.
        */}
        <div
          aria-hidden
          className="page-wash pointer-events-none absolute inset-x-0 top-0 h-64 lg:hidden"
        />

        <header className="relative z-10 flex shrink-0 items-center justify-between px-5 py-4 md:px-10">
          <Logo showWordmark />
          <BackLink href="/">Back to events</BackLink>
        </header>

        {/*
          The footer is pinned rather than pushed: at 1440x768 the column ran
          seven pixels long, so the whole page scrolled purely to reach Terms.
          Only this middle band scrolls, and only when the viewport is short.
        */}
        <main className="relative z-10 flex flex-1 items-center px-5 py-6 md:px-10 lg:min-h-0 lg:overflow-y-auto">
          <div className="mx-auto w-full max-w-[25rem]">{children}</div>
        </main>

        <footer className="relative z-10 flex shrink-0 items-center justify-center gap-5 px-5 py-5 text-xs text-ink-3 md:px-10">
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

          {/*
            Typographic rather than iconed: the design system keeps its chips
            for tinted quick actions, and three white pills on the wash read as
            borrowed furniture.
          */}
          <ul className="mt-10 border-t border-hairline/70">
            {PROOF.map((line) => (
              <li
                key={line}
                className="border-b border-hairline/70 py-4 text-sm leading-relaxed text-ink-2"
              >
                {line}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
