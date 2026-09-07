import { ExternalLink, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/surface";
import { FieldRow } from "@/components/ui/field-row";
import { DisconnectStripeButton } from "@/components/dashboard/disconnect-stripe";
import { formatDate } from "@/lib/format";
import type { Tables } from "@/lib/types";

type PaymentAccount = Tables["payment_accounts"]["Row"];

export async function StripeStatusCard({
  accountPromise,
  organizerId,
  connectConfigured,
}: {
  accountPromise: PromiseLike<PaymentAccount | null>;
  organizerId: string;
  connectConfigured: boolean;
}) {
  const account = await accountPromise;
  const live = Boolean(account?.charges_enabled && !account?.disconnected_at);

  return (
    <Card>
      <CardHeader bordered>
        <div>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="size-4 text-ink-3" />
            Stripe Connect
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
            <DisconnectStripeButton organizerId={organizerId} />
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
              <a href={`/api/connect/stripe/start?organizer=${organizerId}`}>
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
  );
}
