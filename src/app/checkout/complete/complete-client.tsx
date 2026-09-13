"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Loader2, Lock } from "lucide-react";
import { useAsyncAction } from "@/hooks";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/surface";
import { FormError } from "@/components/ui/form";
import { Shimmer } from "@/components/ui/skeleton";
import { useTheme } from "@/contexts";

type Intent = { clientSecret: string; publishableKey: string | null };

const stripeCache = new Map<string, Promise<Stripe | null>>();

function stripeFor(publishableKey: string) {
  let promise = stripeCache.get(publishableKey);
  if (!promise) {
    promise = loadStripe(publishableKey);
    stripeCache.set(publishableKey, promise);
  }
  return promise;
}

export function CompleteClient({
  orderId,
  orderNumber,
  totalCents,
  currency,
  returningFromRedirect,
}: {
  orderId: string;
  orderNumber: string;
  totalCents: number;
  currency: string;
  returningFromRedirect: boolean;
}) {
  const router = useRouter();
  const { resolved } = useTheme();
  const [intent, setIntent] = useState<Intent | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);

  const finish = useCallback(() => {
    router.push(`/account/orders/${orderId}?celebrate=1`);
    router.refresh();
  }, [router, orderId]);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (returningFromRedirect) {
        const response = await fetch(`/api/orders/${orderId}/confirm`, { method: "POST" });
        if (response.ok) {
          finish();
          return;
        }
      }

      const response = await fetch(`/api/orders/${orderId}/intent`, { method: "POST" });
      const body = await response.json();
      if (cancelled) return;

      if (!response.ok) {
        setSetupError(body.error ?? "Could not start the card payment.");
        return;
      }
      if (!body.clientSecret || !body.publishableKey) {
        setSetupError("Card payments are not available on this deployment.");
        return;
      }
      setIntent({ clientSecret: body.clientSecret, publishableKey: body.publishableKey });
    }

    start();
    return () => {
      cancelled = true;
    };
  }, [orderId, returningFromRedirect, finish]);

  return (
    <div className="container-narrow py-10">
      <Card>
        <CardHeader>
          <CardTitle>Pay for order {orderNumber}</CardTitle>
          <CardDescription>
            {formatMoney(totalCents, currency)} — your tickets are held until this completes.
          </CardDescription>
        </CardHeader>
        <CardBody className="space-y-5">
          <FormError message={setupError} />

          {!intent && !setupError ? (
            <div className="space-y-3">
              <Shimmer className="h-11" />
              <Shimmer className="h-11" />
              <Shimmer className="h-11 w-1/2" />
            </div>
          ) : null}

          {intent ? (
            <Elements
              stripe={stripeFor(intent.publishableKey!)}
              options={{
                clientSecret: intent.clientSecret,
                appearance: { theme: resolved === "dark" ? "night" : "stripe" },
              }}
            >
              <PaymentForm orderId={orderId} totalCents={totalCents} currency={currency} onPaid={finish} />
            </Elements>
          ) : null}

          {setupError ? (
            <Button variant="outline" size="md" onClick={() => router.push(`/checkout/${orderId}`)}>
              Back to checkout
            </Button>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}

function PaymentForm({
  orderId,
  totalCents,
  currency,
  onPaid,
}: {
  orderId: string;
  totalCents: number;
  currency: string;
  onPaid: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const pay = useAsyncAction(async () => {
    if (!stripe || !elements) return;

    const { error } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: `${window.location.origin}/checkout/complete?order=${orderId}`,
      },
    });

    if (error) throw new Error(error.message ?? "The payment could not be completed.");

    const response = await fetch(`/api/orders/${orderId}/confirm`, { method: "POST" });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "The payment could not be confirmed.");

    onPaid();
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        pay.run();
      }}
      className="space-y-5"
    >
      <PaymentElement />
      <FormError message={pay.error} />

      <Button type="submit" variant="solid" size="lg" disabled={!stripe || pay.pending} className="w-full">
        {pay.pending ? <Loader2 className="animate-spin" /> : <Lock />}
        Pay {formatMoney(totalCents, currency)}
      </Button>
    </form>
  );
}
