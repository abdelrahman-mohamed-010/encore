"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { AffixInput, Field, Textarea } from "@/components/ui/input";
import { formatMoney } from "@/lib/format";

export function RefundButton({
  orderId,
  orderNumber,
  maxCents,
  currency,
}: {
  orderId: string;
  orderNumber: string;
  maxCents: number;
  currency: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState((maxCents / 100).toFixed(2));
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setError(null);
    const cents = Math.round(Number(amount) * 100);

    if (!Number.isFinite(cents) || cents <= 0) return setError("Enter an amount to refund.");
    if (cents > maxCents) return setError(`The most you can refund is ${formatMoney(maxCents, currency)}.`);

    setSaving(true);
    const response = await fetch(`/api/orders/${orderId}/refund`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountCents: cents, reason: reason.trim() || undefined }),
    });
    const result = await response.json();
    setSaving(false);

    if (!response.ok) {
      setError(result.error ?? "The refund could not be issued.");
      return;
    }

    toast.success(result.full_refund ? "Order fully refunded" : "Partial refund issued", {
      description: result.full_refund ? "Tickets were voided and inventory returned." : undefined,
    });
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button variant="ghost" size="xs" onClick={() => setOpen(true)}>
        Refund
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Refund order</DialogTitle>
            <DialogDescription>
              <span className="font-mono">{orderNumber}</span> — up to{" "}
              {formatMoney(maxCents, currency)} can be returned.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <Field
              label="Amount"
              htmlFor="refundAmount"
              hint="A full refund voids the tickets and puts the inventory back on sale."
            >
              <AffixInput
                id="refundAmount"
                prefix={currency}
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>

            <Field label="Reason" htmlFor="refundReason" error={error}>
              <Textarea
                id="refundReason"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Customer request"
                aria-invalid={Boolean(error)}
              />
            </Field>
          </DialogBody>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="danger" loading={saving} onClick={submit}>
              Refund {formatMoney(Math.round(Number(amount) * 100) || 0, currency)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
