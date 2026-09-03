import Link from "next/link";
import { Logo } from "@/components/logo";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Discover",
    links: [
      { href: "/events", label: "All events" },
      { href: "/categories", label: "Categories" },
      { href: "/organizers", label: "Organizers" },
      { href: "/events?free=1", label: "Free events" },
    ],
  },
  {
    title: "Organizers",
    links: [
      { href: "/dashboard/new", label: "Start selling" },
      { href: "/pricing", label: "Pricing" },
      { href: "/dashboard", label: "Dashboard" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/account/tickets", label: "My tickets" },
      { href: "/account/orders", label: "Orders" },
      { href: "/auth/login", label: "Sign in" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-hairline bg-card">
      <div className="container-page py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-3.5 text-[13.5px] leading-relaxed text-ink-3">
              A modern ticketing platform. Discover what is on, buy in seconds, and run your own
              events with real-time sales and check-in.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="eyebrow mb-3">{column.title}</p>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-[13.5px] text-ink-2 transition-colors hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-hairline-soft pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12.5px] text-ink-3">
            © {new Date().getFullYear()} Tazkarti. Built with Next.js, Supabase and Stripe.
          </p>
          <div className="flex items-center gap-5 text-[12.5px] text-ink-3">
            <Link href="/legal/terms" className="transition-colors hover:text-ink-2">Terms</Link>
            <Link href="/legal/privacy" className="transition-colors hover:text-ink-2">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
