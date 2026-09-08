import Link from "next/link";
import { AtSign, Mail, MessageCircle } from "lucide-react";
import { Logo } from "@/components/logo";

/**
 * One row of links beside the wordmark, then a legal line — the reference's
 * shape. A four-column sitemap is for products with more surface area than
 * this one; here it padded the bottom of every page with links the header
 * already carries.
 */
const LINKS = [
  { href: "/events", label: "Discover" },
  { href: "/pricing", label: "Pricing" },
  { href: "/dashboard/new", label: "Start selling" },
];

const LEGAL = [
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/privacy", label: "Privacy" },
];

export function SiteFooter() {
  return (
    <footer className="mt-24">
      <div className="container-page">
        <div className="flex flex-col gap-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Logo showWordmark />
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-md text-ink-2 transition-colors hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-5 text-ink-3">
            <a
              href="mailto:hello@encore.app"
              aria-label="Email us"
              className="transition-colors hover:text-ink"
            >
              <Mail className="size-[18px]" />
            </a>
            <Link href="/help" aria-label="Help" className="transition-colors hover:text-ink">
              <MessageCircle className="size-[18px]" />
            </Link>
            <Link href="/" aria-label="Encore home" className="transition-colors hover:text-ink">
              <AtSign className="size-[18px]" />
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-2 pb-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-3">
            © {new Date().getFullYear()} Encore. Built with Next.js, Supabase and Stripe.
          </p>
          <div className="flex items-center gap-5 text-sm text-ink-3">
            {LEGAL.map((link) => (
              <Link key={link.href} href={link.href} className="transition-colors hover:text-ink-2">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
