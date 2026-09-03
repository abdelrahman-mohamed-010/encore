"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, CheckCircle2, CreditCard, Timer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, Divider } from "@/components/ui/surface";
import { Badge } from "@/components/ui/badge";
import { Field, Input } from "@/components/ui/input";
import { SummaryLine } from "@/components/ui/misc";
import { formatCountdown, formatEventStamp, formatMoney } from "@/lib/format";
import { orderTotals, type FeeSettings } from "@/lib/pricing";
import { cn } from "@/lib/utils";

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
  order_number: string;
  subtotal_cents: number;
  discount_cents: number;
  fee_cents: number;
  total_cents: number;
  currency: string;
  provider: "stripe" | "sandbox";
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
  const ticketCount = lines.reduce((sum, l) => sum + l.quantity, 0);

  const [name, setName] = useState(buyer.name);
  const [email, setEmail] = useState(buyer.email);
  const [phone, setPhone] = useState(buyer.phone);
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; discountCents: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoChecking, setPromoChecking] = useState(false);

  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [cardExpiry, setCardExpiry] = useState("12 / 30");
  const [cardCvc, setCardCvc] = useState("123");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [msLeft, setMsLeft] = useState(() => new Date(expiresAt).getTime() - Date.now());
  const expiredHandled = useRef(false);

  // Countdown on the hold. When it runs out the tickets are already back in the
  // pool server-side, so send the buyer back rather than letting them pay.
  useEffect(() => {
    const tick = setInterval(() => {
      const remaining = new Date(expiresAt).getTime() - Date.now();
      setMsLeft(remaining);
      if (remaining <= 0 && !expiredHandled.current) {
        expiredHandled.current = true;
        toast.error("Your ticket hold expired", {
          description: "Please choose your tickets again.",
        });
        router.push(`/events/${event.slug}?expired=1`);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [expiresAt, event.slug, router]);

  // Same arithmetic as create_order_from_reservation, driven by the platform's
  // real fee settings, so the previewed total matches what the buyer is charged.
  const {
    subtotalCents: subtotal,
    feeCents: feePreview,
    totalCents: totalPreview,
    discountCents: discount,
  } = orderTotals(lines, promo?.discountCents ?? 0, feeSettings);

  // A plain function: it is only used by the button and the Enter key, so
  // memoising it buys nothing and blocks the React Compiler from optimising
  // the component.
  async function applyPromo() {
    const code = promoInput.trim();
    if (!code) return;

    setPromoChecking(true);
    setPromoError(null);

    const response = await fetch("/api/checkout/promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: event.id, code, subtotalCents: subtotal }),
    });
    const result = await response.json();
    setPromoChecking(false);

    if (!response.ok || !result.valid) {
      setPromo(null);
      setPromoError(result.message ?? result.error ?? "That code is not valid.");
      return;
    }

    setPromo({ code: result.code, discountCents: result.discount_cents });
    toast.success(`${result.code} applied`);
  }

  async function submit(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    setFormError(null);

    if (name.trim().length < 2) return setFormError("Enter the name on the tickets.");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setFormError("Enter a valid email address.");

    setSubmitting(true);

    // 1. Freeze the amounts into a pending order.
    const orderResponse = await fetch("/api/checkout/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reservationId,
        buyerName: name.trim(),
        buyerEmail: email.trim(),
        buyerPhone: phone.trim() || null,
        promoCode: promo?.code ?? null,
      }),
    });
    const order = (await orderResponse.json()) as OrderSummary & { error?: string; code?: string };

    if (!orderResponse.ok) {
      setSubmitting(false);
      if (order.code === "hold_expired") {
        router.push(`/events/${event.slug}?expired=1`);
        return;
      }
      setFormError(order.error ?? "Could not start the order.");
      return;
    }

    // 2. Settle it. Stripe orders get an intent; everything else uses the
    //    sandbox rail, which is also what free orders take.
    if (order.provider === "stripe") {
      const intentResponse = await fetch(`/api/orders/${order.order_id}/intent`, { method: "POST" });
      const intent = await intentResponse.json();
      setSubmitting(false);

      if (!intentResponse.ok) {
        setFormError(intent.error ?? "Could not start the card payment.");
        return;
      }
      // Stripe Elements takes over from here.
      router.push(`/checkout/complete?order=${order.order_id}&secret=${intent.clientSecret}`);
      return;
    }

    const payResponse = await fetch(`/api/orders/${order.order_id}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardNumber: order.total_cents > 0 ? cardNumber : "0000000000000" }),
    });
    const paid = await payResponse.json();
    setSubmitting(false);

    if (!payResponse.ok) {
      if (paid.code === "hold_expired") {
        router.push(`/events/${event.slug}?expired=1`);
        return;
      }
      setFormError(paid.error ?? "The payment could not be completed.");
      return;
    }

    router.push(`/account/orders/${order.order_id}?celebrate=1`);
    router.refresh();
  }

  const urgent = msLeft < 2 * 60 * 1000;

  return (
    <div className="container-page py-8 md:py-10">
      <Link
        href={`/events/${event.slug}`}
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-ink-3 transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" />
        Back to event
      </Link>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
        {/* ---- Form ------------------------------------------------------- */}
        <form id="checkout-form" onSubmit={submit} className="min-w-0 space-y-6" noValidate>
          <div>
            <h1 className="display-2 text-ink">Checkout</h1>
            <p className="mt-2 text-[14px] text-ink-2">
              {ticketCount} {ticketCount === 1 ? "ticket" : "tickets"} for {event.title}
            </p>
          </div>

          <div
            className={cn(
              "flex items-center gap-3 rounded-xl border px-4 py-3",
              urgent
                ? "border-transparent bg-critical-bg text-critical"
                : "border-hairline bg-card text-ink-2",
            )}
            role="status"
          >
            <Timer className="size-4 shrink-0" />
            <p className="text-[13.5px]">
              {msLeft > 0 ? (
                <>
                  Your tickets are held for{" "}
                  <span className="font-semibold tabular">{formatCountdown(msLeft)}</span>
                </>
              ) : (
                "Your hold has expired."
              )}
            </p>
          </div>

          <Card>
            <div className="border-b border-hairline-soft px-5 py-4">
              <h2 className="text-[15px] font-semibold text-ink">Your details</h2>
              <p className="mt-0.5 text-[13px] text-ink-3">Your tickets are sent to this email.</p>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="Full name" htmlFor="buyerName" required className="sm:col-span-2">
                <Input
                  id="buyerName"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field label="Email" htmlFor="buyerEmail" required>
                <Input
                  id="buyerEmail"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field label="Phone" htmlFor="buyerPhone" hint="Optional">
                <Input
                  id="buyerPhone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </Field>
            </div>
          </Card>

          {totalPreview > 0 && (
            <Card>
              <div className="border-b border-hairline-soft px-5 py-4">
                <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
                  <CreditCard className="size-4 text-ink-3" />
                  Payment
                </h2>
                <p className="mt-0.5 text-[13px] text-ink-3">
                  This organizer has not connected Stripe yet, so this deployment settles the order
                  through the built-in sandbox rail. Use 4242 4242 4242 4242 to succeed, or
                  4000 0000 0000 0002 to see a decline.
                </p>
              </div>
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <Field label="Card number" htmlFor="cardNumber" className="sm:col-span-2">
                  <Input
                    id="cardNumber"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                  />
                </Field>
                <Field label="Expiry" htmlFor="cardExpiry">
                  <Input
                    id="cardExpiry"
                    autoComplete="cc-exp"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                  />
                </Field>
                <Field label="CVC" htmlFor="cardCvc">
                  <Input
                    id="cardCvc"
                    autoComplete="cc-csc"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                  />
                </Field>
              </div>
            </Card>
          )}

          {formError && (
            <div
              className="flex items-start gap-2.5 rounded-xl border border-transparent bg-critical-bg px-4 py-3 text-[13.5px] text-critical"
              role="alert"
            >
              <AlertCircle className="mt-px size-4 shrink-0" />
              {formError}
            </div>
          )}

          <Button
            type="submit"
            variant="solid"
            size="xl"
            block
            loading={submitting}
            disabled={msLeft <= 0}
            className="lg:hidden"
          >
            {totalPreview === 0 ? "Get tickets" : `Pay ${formatMoney(totalPreview, currency)}`}
          </Button>
        </form>

        {/* ---- Summary ---------------------------------------------------- */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <Card className="overflow-hidden">
            <div className="flex gap-3.5 border-b border-hairline-soft p-4">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-sunken">
                {event.coverImageUrl && (
                  <Image src={event.coverImageUrl} alt="" fill sizes="56px" className="object-cover" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold text-ink">{event.title}</p>
                <p className="mt-0.5 truncate text-[12.5px] text-ink-3">
                  {formatEventStamp(event.startsAt, event.timezone ?? undefined)}
                </p>
                <p className="truncate text-[12.5px] text-ink-3">{event.placeLabel}</p>
              </div>
            </div>

            <div className="space-y-3 p-4">
              {lines.map((line) => (
                <div key={line.id} className="flex items-start justify-between gap-3 text-[13.5px]">
                  <div className="min-w-0">
                    <p className="text-ink">
                      {line.quantity} × {line.name}
                    </p>
                    {line.seatLabel && (
                      <p className="mt-0.5 truncate text-[12px] text-ink-3">{line.seatLabel}</p>
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
              <Field label="Promo code" htmlFor="promo" error={promoError}>
                <div className="flex gap-2">
                  <Input
                    id="promo"
                    placeholder="CAIRO20"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void applyPromo();
                      }
                    }}
                    aria-invalid={Boolean(promoError)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    loading={promoChecking}
                    onClick={applyPromo}
                    disabled={!promoInput.trim()}
                  >
                    Apply
                  </Button>
                </div>
              </Field>

              {promo && (
                <Badge tone="positive" size="md" className="mt-2.5">
                  <CheckCircle2 className="size-3" />
                  {promo.code} · −{formatMoney(promo.discountCents, currency)}
                </Badge>
              )}
            </div>

            <Divider />

            <div className="space-y-2.5 p-4">
              <SummaryLine label="Subtotal" value={formatMoney(subtotal, currency)} />
              {discount > 0 && (
                <SummaryLine
                  label="Discount"
                  value={`−${formatMoney(discount, currency)}`}
                  className="text-positive"
                />
              )}
              <SummaryLine label="Service fee" value={formatMoney(feePreview, currency)} />
              <Divider className="!my-3" />
              <SummaryLine label="Total" value={formatMoney(totalPreview, currency)} strong />
            </div>

            <div className="hidden border-t border-hairline-soft p-4 lg:block">
              {/* Lives outside the form element, so it is wired back by id. */}
              <Button
                type="submit"
                form="checkout-form"
                variant="solid"
                size="lg"
                block
                loading={submitting}
                disabled={msLeft <= 0}
              >
                {totalPreview === 0 ? "Get tickets" : `Pay ${formatMoney(totalPreview, currency)}`}
              </Button>
              <p className="mt-2.5 text-center text-[11.5px] leading-relaxed text-ink-3">
                By paying you agree to the organizer&apos;s terms and our refund policy.
              </p>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
