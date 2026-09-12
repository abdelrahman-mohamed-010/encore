"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, CreditCard, Timer } from "lucide-react";
import { toast } from "sonner";
import { useAsyncAction, useCountdown, usePromoCode } from "@/hooks";
import { buyerSchema, type BuyerData, type BuyerValues } from "@/lib/validation/checkout";
import { orderTotals, type FeeSettings } from "@/lib/pricing";
import { formatCountdown, formatEventStamp, formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, Divider } from "@/components/ui/surface";
import { Badge } from "@/components/ui/badge";
import { Form, FormError, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { SummaryLine } from "@/components/ui/stat-tile";import { cn } from "@/lib/utils";
import { expireReservations } from "@/features/checkout/actions";

type Line = {
  id: string;
  name: string;
  currency: string;
  quantity: number;
  unitPriceCents: number;
  seatLabel: string | null;
};

type OrderSummary = {
  order_id: string;
  total_cents: number;
  provider: "stripe" | "sandbox";
  error?: string;
  code?: string;
};

export function CheckoutClient({
  reservationId,
  expiresAt,
  event,
  lines,
  buyer,
  feeSettings,
}: {
  reservationId: string;
  expiresAt: string;
  event: {
    id: string;
    title: string;
    slug: string;
    startsAt: string;
    timezone: string | null;
    coverImageUrl: string | null;
    organizerName: string;
    placeLabel: string;
  };
  lines: Line[];
  buyer: { name: string; email: string; phone: string };
  feeSettings: FeeSettings;
}) {
  const router = useRouter();
  const currency = lines[0]?.currency ?? "USD";
  const ticketCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  // Three composed hooks replace the fourteen useState calls this screen used
  // to hold: the hold timer, the promo lookup, and the submission lifecycle.
  const { msLeft, expired } = useCountdown(expiresAt, async () => {
    toast.error("Your ticket hold expired", { description: "Please choose your tickets again." });
    // Hand the seats back before leaving, so they are pickable again the
    // instant the buyer lands on the event rather than a sweep later. Failing
    // to is not worth blocking the redirect: the sweep will catch it.
    try {
      await expireReservations({ eventId: event.id });
    } catch {
      // ignored on purpose
    }
    router.push(`/events/${event.slug}?expired=1`);
  });
  const promo = usePromoCode(event.id);
  const [promoInput, setPromoInput] = useState("");
  const [card, setCard] = useState("4242 4242 4242 4242");

  const totals = orderTotals(lines, promo.discountCents, feeSettings);

  const form = useForm<BuyerValues, unknown, BuyerData>({
    resolver: zodResolver(buyerSchema),
    defaultValues: {
      buyerName: buyer.name,
      buyerEmail: buyer.email,
      buyerPhone: buyer.phone,
      promoCode: "",
    },
  });

  const pay = useAsyncAction(async (values: BuyerData) => {
    // 1. Freeze the amounts into a pending order.
    const orderResponse = await fetch("/api/checkout/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reservationId,
        buyerName: values.buyerName,
        buyerEmail: values.buyerEmail,
        buyerPhone: values.buyerPhone || null,
        promoCode: promo.applied?.code ?? null,
      }),
    });
    const order = (await orderResponse.json()) as OrderSummary;

    if (!orderResponse.ok) {
      if (order.code === "hold_expired") {
        router.push(`/events/${event.slug}?expired=1`);
        return;
      }
      throw new Error(order.error ?? "Could not start the order.");
    }

    // 2. Settle it on whichever rail the order was created for.
    if (order.provider === "stripe") {
      router.push(`/checkout/complete?order=${order.order_id}`);
      return;
    }

    const payResponse = await fetch(`/api/orders/${order.order_id}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardNumber: order.total_cents > 0 ? card : "0000000000000" }),
    });
    const paid = await payResponse.json();

    if (!payResponse.ok) {
      if (paid.code === "hold_expired") {
        router.push(`/events/${event.slug}?expired=1`);
        return;
      }
      throw new Error(paid.error ?? "The payment could not be completed.");
    }

    router.push(`/account/orders/${order.order_id}?celebrate=1`);
    router.refresh();
  });

  const urgent = msLeft < 2 * 60 * 1000;
  const submitLabel =
    totals.totalCents === 0 ? "Get tickets" : `Pay ${formatMoney(totals.totalCents, currency)}`;

  return (
    <div className="container-page py-8 md:py-10">
      <Link
        href={`/events/${event.slug}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-3 transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" />
        Back to event
      </Link>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
        <Form id="checkout-form" form={form} onSubmit={pay.run} className="min-w-0 space-y-6">
          <div>
            <h1 className="display-2 text-ink">Checkout</h1>
            <p className="mt-2 text-base text-ink-2">
              {ticketCount} {ticketCount === 1 ? "ticket" : "tickets"} for {event.title}
            </p>
          </div>

          <div
            role="status"
            className={cn(
              "flex items-center gap-3 rounded-xl border px-4 py-3",
              urgent ? "border-transparent bg-critical-bg text-critical" : "border-hairline bg-card text-ink-2",
            )}
          >
            <Timer className="size-4 shrink-0" />
            <p className="text-sm">
              {expired ? (
                "Your hold has expired."
              ) : (
                <>
                  Your tickets are held for{" "}
                  <span className="font-semibold tabular">{formatCountdown(msLeft)}</span>
                </>
              )}
            </p>
          </div>

          <Card>
            <div className="border-b border-hairline-soft px-5 py-4">
              <h2 className="text-md font-semibold text-ink">Your details</h2>
              <p className="mt-0.5 text-sm text-ink-3">Your tickets are sent to this email.</p>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <FormField<BuyerValues, "buyerName"> name="buyerName" label="Full name" required className="sm:col-span-2">
                {(field) => <Input {...field} autoComplete="name" />}
              </FormField>
              <FormField<BuyerValues, "buyerEmail"> name="buyerEmail" label="Email" required>
                {(field) => <Input {...field} type="email" autoComplete="email" />}
              </FormField>
              <FormField<BuyerValues, "buyerPhone"> name="buyerPhone" label="Phone" hint="Optional">
                {(field) => <Input {...field} type="tel" autoComplete="tel" />}
              </FormField>
            </div>
          </Card>

          {totals.totalCents > 0 && (
            <Card>
              <div className="border-b border-hairline-soft px-5 py-4">
                <h2 className="flex items-center gap-2 text-md font-semibold text-ink">
                  <CreditCard className="size-4 text-ink-3" />
                  Payment
                </h2>
                <p className="mt-0.5 text-sm text-ink-3">
                  This organizer has not connected Stripe yet, so the order settles through the
                  built-in sandbox rail. Use 4242 4242 4242 4242 to succeed, or 4000 0000 0000 0002
                  to see a decline.
                </p>
              </div>
              <div className="p-5">
                <label htmlFor="card" className="text-sm font-medium text-ink-2">
                  Card number
                </label>
                <Input
                  id="card"
                  className="mt-1.5"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  value={card}
                  onChange={(e) => setCard(e.target.value)}
                />
              </div>
            </Card>
          )}

          <FormError message={pay.error} />

          <Button
            type="submit"
            variant="primary"
            size="xl"
            block
            loading={form.formState.isSubmitting}
            disabled={expired}
            className="lg:hidden"
          >
            {submitLabel}
          </Button>
        </Form>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <Card className="overflow-hidden">
            <div className="flex gap-3.5 border-b border-hairline-soft p-4">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-sunken">
                {event.coverImageUrl && (
                  <Image src={event.coverImageUrl} alt="" fill sizes="56px" className="object-cover" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-ink">{event.title}</p>
                <p className="mt-0.5 truncate text-xs text-ink-3">
                  {formatEventStamp(event.startsAt, event.timezone ?? undefined)}
                </p>
                <p className="truncate text-xs text-ink-3">{event.placeLabel}</p>
              </div>
            </div>

            <div className="space-y-3 p-4">
              {lines.map((line) => (
                <div key={line.id} className="flex items-start justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="text-ink">
                      {line.quantity} × {line.name}
                    </p>
                    {line.seatLabel && (
                      <p className="mt-0.5 truncate text-xs text-ink-3">{line.seatLabel}</p>
                    )}
                  </div>
                  <span className="shrink-0 tabular text-ink">
                    {formatMoney(line.unitPriceCents * line.quantity, line.currency)}
                  </span>
                </div>
              ))}
            </div>

            <Divider />

            <div className="p-4">
              <label htmlFor="promo" className="text-sm font-medium text-ink-2">
                Promo code
              </label>
              <div className="mt-1.5 flex gap-2">
                <Input
                  id="promo"
                  placeholder="CAIRO20"
                  value={promoInput}
                  aria-invalid={Boolean(promo.error)}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void promo.apply(promoInput, totals.subtotalCents);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  loading={promo.checking}
                  disabled={!promoInput.trim()}
                  onClick={() => promo.apply(promoInput, totals.subtotalCents)}
                >
                  Apply
                </Button>
              </div>
              {promo.error && <p className="mt-1.5 text-xs text-critical">{promo.error}</p>}
              {promo.applied && (
                <Badge tone="positive" size="md" className="mt-2.5">
                  <CheckCircle2 className="size-3" />
                  {promo.applied.code} · −{formatMoney(promo.applied.discountCents, currency)}
                </Badge>
              )}
            </div>

            <Divider />

            <div className="space-y-2.5 p-4">
              <SummaryLine label="Subtotal" value={formatMoney(totals.subtotalCents, currency)} />
              {totals.discountCents > 0 && (
                <SummaryLine
                  label="Discount"
                  value={`−${formatMoney(totals.discountCents, currency)}`}
                  className="text-positive"
                />
              )}
              <SummaryLine label="Service fee" value={formatMoney(totals.feeCents, currency)} />
              <Divider className="!my-3" />
              <SummaryLine label="Total" value={formatMoney(totals.totalCents, currency)} strong />
            </div>

            <div className="hidden border-t border-hairline-soft p-4 lg:block">
              <Button
                type="submit"
                form="checkout-form"
                variant="primary"
                size="lg"
                block
                loading={form.formState.isSubmitting}
                disabled={expired}
              >
                {submitLabel}
              </Button>
              <p className="mt-2.5 text-center text-2xs leading-relaxed text-ink-3">
                By paying you agree to the organizer&apos;s terms and our refund policy.
              </p>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
