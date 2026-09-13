import Link from "next/link";
import type { Metadata } from "next";
import { Check } from "lucide-react";
import { getPlatformSettings } from "@/features/catalog/queries";
import { Button } from "@/components/ui/button";
import { Card, CardBody, SectionHeader } from "@/components/ui/surface";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Pricing" };
export const revalidate = 3600;

const INCLUDED = [
  "Unlimited events and ticket types",
  "Reserved seating with a live seat map",
  "Your own Stripe account — direct payouts",
  "QR check-in from any phone",
  "Promo codes and discounts",
  "Real-time sales and attendee lists",
  "Team roles: owner, admin, staff, scanner",
  "Refunds that return inventory automatically",
];

export default async function PricingPage() {
  const settings = await getPlatformSettings();

  const percent = settings?.platform_fee_percent ?? 5;
  const fixed = settings?.platform_fee_fixed_cents ?? 99;

  return (
    <div className="container-page py-14 md:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">Pricing</p>
        <h1 className="display-1 mt-3 text-ink">Free to start. We earn when you sell.</h1>
        <p className="mx-auto mt-5 max-w-lg text-md leading-relaxed text-ink-2">
          No monthly fee, no setup cost. Encore takes a service fee on paid tickets, added at
          checkout, and free events cost nothing at all.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
        <Card className="p-7">
          <p className="eyebrow">Free events</p>
          <p className="mt-3 font-display text-[2.5rem] font-semibold leading-none numeral text-ink">$0</p>
          <p className="mt-3 text-base leading-relaxed text-ink-2">
            Zero fees on tickets priced at zero. Registration, check-in and attendee lists all
            included.
          </p>
          <Button asChild variant="outline" size="lg" block className="mt-7">
            <Link href="/dashboard/new">Start free</Link>
          </Button>
        </Card>

        <Card className="border-solid p-7 ring-1 ring-solid">
          <p className="eyebrow">Paid tickets</p>
          <p className="mt-3 flex items-baseline gap-1.5">
            <span className="font-display text-[2.5rem] font-semibold leading-none numeral text-ink">
              {percent}%
            </span>
            <span className="text-md text-ink-2">+ {formatMoney(fixed)}</span>
          </p>
          <p className="mt-3 text-base leading-relaxed text-ink-2">
            Per order, added on top at checkout so your ticket price is what the buyer sees as the
            ticket price. Stripe&apos;s own processing fee is separate and set by Stripe.
          </p>
          <Button asChild variant="solid" size="lg" block className="mt-7">
            <Link href="/dashboard/new">Start selling</Link>
          </Button>
        </Card>
      </div>

      <Card className="mx-auto mt-8 max-w-4xl">
        <CardBody>
          <SectionHeader title="Everything is included" className="mb-6" />
          <ul className="grid gap-3 sm:grid-cols-2">
            {INCLUDED.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-base text-ink-2">
                <Check className="mt-0.5 size-4 shrink-0 text-positive" />
                {item}
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
