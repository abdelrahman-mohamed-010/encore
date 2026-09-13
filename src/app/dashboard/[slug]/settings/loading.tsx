"use client";

import { SettingsRow } from "@/components/ui/settings-row";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { Shimmer } from "@/components/ui/skeleton";

/** Mirrors organizer-settings-form.tsx — only the actual profile-field
 *  values shimmer; the web address and payouts link need no fetch at all,
 *  since the organizer's slug is already the route param. */
export default function Loading() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <div className="max-w-2xl space-y-12">
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink">Organization Profile</h2>
          <p className="mt-1 text-sm text-ink-3">
            Manage your organization&apos;s public branding, contact info, and presence.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-[1fr_auto]">
          <div className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <Label>Organization Name</Label>
              <Shimmer className="h-(--size-field) rounded-md" />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Web Address</Label>
              <div className="flex h-(--size-field) w-full cursor-not-allowed items-center rounded-md bg-sunken/40 px-3.5 text-md text-ink-2">
                /organizers/{slug}
              </div>
              <p className="text-xs text-ink-3">
                Fixed web address to ensure existing event links and QR codes remain permanent.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Support Email</Label>
                <Shimmer className="h-(--size-field) rounded-md" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Official Website</Label>
                <Shimmer className="h-(--size-field) rounded-md" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>About &amp; Bio</Label>
              <Shimmer className="h-28 rounded-md" />
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 sm:items-start md:pl-6">
            <Label>Organization Logo</Label>
            <Shimmer className="size-24 rounded-2xl md:size-28" />
          </div>
        </div>

        <div className="pt-2">
          <Shimmer className="h-12 w-36 rounded-xl" />
        </div>
      </section>

      <section className="space-y-4 border-t border-hairline/80 pt-8">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-ink">Payouts &amp; Stripe</h3>
          <p className="mt-1 text-sm text-ink-3">Manage bank account connections and payout schedules.</p>
        </div>

        <SettingsRow
          icon={CreditCard}
          title="Stripe Connect"
          description="Securely process ticket credit cards and receive automatic payouts directly to your bank account."
          action={
            <Button asChild variant="outline" size="sm" className="rounded-xl shrink-0">
              <Link href={`/dashboard/${slug}/settings/payments`}>Configure Payouts</Link>
            </Button>
          }
        />
      </section>
    </div>
  );
}
