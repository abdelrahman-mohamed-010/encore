import type { Metadata } from "next";
import { AlertTriangle, CheckCircle2, ExternalLink, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireOrganizer } from "@/lib/auth";
import { isStripeConnectConfigured } from "@/lib/payments/stripe";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle, CardDescription, SectionHeader } from "@/components/ui/surface";
import { FieldRow } from "@/components/ui/field-row";
import { DisconnectStripeButton } from "@/components/dashboard/disconnect-stripe";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Payments" };

export default async function PaymentsSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const { slug } = await params;
  const { connected, error } = await searchParams;
  const { organizer } = await requireOrganizer(slug, "admin");
  const supabase = await createClient();

  const { data: account } = await supabase
    .from("payment_accounts")
    .select("*")
    .eq("organizer_id", organizer.id)
    .maybeSingle();

  const connectConfigured = isStripeConnectConfigured();
  const live = Boolean(account?.charges_enabled && !account?.disconnected_at);

  return (
    <div className="max-w-2xl space-y-6">
      <SectionHeader
        level={1}
        title="Payments"
        description="Connect your own Stripe account. Ticket money goes straight to you; Tazkarti takes only its service fee as an application fee on each charge."
      />

      {connected === "1" && (
        <div className="flex items-start gap-2.5 rounded-xl border border-transparent bg-positive-bg px-4 py-3 text-sm text-positive">
          <CheckCircle2 className="mt-px size-4 shrink-0" />
          Stripe connected. If charges are still disabled, finish the remaining steps in Stripe.
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-transparent bg-critical-bg px-4 py-3 text-sm text-critical">
          <AlertTriangle className="mt-px size-4 shrink-0" />
          {decodeURIComponent(error)}
        </div>
      )}

      <Card>
        <CardHeader bordered>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="size-4 text-ink-3" />
              Stripe
            </CardTitle>
            <CardDescription>
              {live
                ? "Card payments are live on your account."
                : "Not taking card payments yet."}
            </CardDescription>
          </div>
          <Badge tone={live ? "positive" : "caution"} size="md">
            {live ? "Connected" : account ? "Incomplete" : "Not connected"}
          </Badge>
        </CardHeader>

        {account ? (
          <>
            <FieldRow
              label="Stripe account"
              value={<span className="font-mono text-sm">{account.stripe_account_id ?? "—"}</span>}
            />
            <FieldRow
              label="Charges"
              value={account.charges_enabled ? "Enabled" : "Disabled — finish onboarding in Stripe"}
            />
            <FieldRow
              label="Payouts"
              value={account.payouts_enabled ? "Enabled" : "Disabled — add a bank account in Stripe"}
            />
            <FieldRow
              label="Connected"
              value={account.connected_at ? formatDate(account.connected_at, "long") : "—"}
            />
            {Array.isArray(account.requirements_due) && account.requirements_due.length > 0 && (
              <FieldRow
                label="Stripe still needs"
                align="start"
                value={
                  <ul className="mt-0.5 space-y-0.5 text-sm text-ink-2">
                    {(account.requirements_due as string[]).slice(0, 6).map((item) => (
                      <li key={item}>· {item.replace(/_/g, " ")}</li>
                    ))}
                  </ul>
                }
              />
            )}

            <CardBody className="flex flex-wrap gap-2 border-t border-hairline-soft">
              <Button asChild variant="outline" size="sm">
                <a href="https://dashboard.stripe.com" target="_blank" rel="noreferrer noopener">
                  Open Stripe <ExternalLink />
                </a>
              </Button>
              <DisconnectStripeButton organizerId={organizer.id} />
            </CardBody>
          </>
        ) : (
          <CardBody className="space-y-4">
            <p className="text-sm leading-relaxed text-ink-2">
              Until you connect Stripe, paid orders on your events settle through the built-in
              sandbox rail: the whole checkout works end to end, tickets are issued, but no real
              money moves.
            </p>

            {connectConfigured ? (
              <Button asChild variant="solid" size="lg">
                <a href={`/api/connect/stripe/start?organizer=${organizer.id}`}>
                  Connect Stripe
                </a>
              </Button>
            ) : (
              <div className="rounded-xl border border-hairline bg-sunken p-4">
                <p className="text-sm font-medium text-ink">
                  Stripe Connect is not configured on this deployment
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
                  The operator needs to set <code className="font-mono text-xs">STRIPE_SECRET_KEY</code>{" "}
                  and <code className="font-mono text-xs">STRIPE_CONNECT_CLIENT_ID</code>, then
                  point a Stripe webhook at{" "}
                  <code className="font-mono text-xs">/api/webhooks/stripe</code>. Once those
                  exist this button starts the OAuth flow and organizers can link their own accounts.
                </p>
              </div>
            )}
          </CardBody>
        )}
      </Card>

      <Card inset className="p-4">
        <p className="text-sm font-medium text-ink">How the money splits</p>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-2">
          Each charge is created on your connected account with Tazkarti&apos;s service fee as the
          Stripe <span className="font-mono text-xs">application_fee_amount</span>. You are the
          merchant of record, payouts follow your Stripe schedule, and refunds pull the platform fee
          back proportionally.
        </p>
      </Card>
    </div>
  );
}
