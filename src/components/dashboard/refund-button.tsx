"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAsyncAction } from "@/hooks";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormError, FormField } from "@/components/ui/form";
import { AffixInput, Textarea } from "@/components/ui/input";
import { formatMoney } from "@/lib/format";

/** Built per-order so the maximum is part of the validation, not a later check. */
function refundFormSchema(maxCents: number, currency: string) {
  return z.object({
    amount: z
      .string()
      .trim()
      .refine((v) => /^\d+(\.\d{1,2})?$/.test(v), "Enter an amount like 45.00")
      .refine((v) => Math.round(Number(v) * 100) > 0, "Enter an amount above zero.")
      .refine(
        (v) => Math.round(Number(v) * 100) <= maxCents,
        `The most you can refund is ${formatMoney(maxCents, currency)}.`,
      ),
    reason: z.string().trim().max(300, "Keep the reason under 300 characters.").optional(),
  });
}

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
  const schema = refundFormSchema(maxCents, currency);
  type Values = z.input<typeof schema>;

  const form = useForm<Values, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { amount: (maxCents / 100).toFixed(2), reason: "" },
  });

  const amount = useWatch({ control: form.control, name: "amount" });

  const refund = useAsyncAction(async (values: z.output<typeof schema>) => {
    const response = await fetch(`/api/orders/${orderId}/refund`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amountCents: Math.round(Number(values.amount) * 100),
        reason: values.reason || undefined,
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "The refund could not be issued.");

    toast.success(result.full_refund ? "Order fully refunded" : "Partial refund issued", {
      description: result.full_refund
        ? "Tickets were voided and the inventory returned."
        : undefined,
    });
    setOpen(false);
    router.refresh();
  });

  const previewCents = /^\d+(\.\d{1,2})?$/.test(amount ?? "")
    ? Math.round(Number(amount) * 100)
    : 0;

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

          <Form form={form} onSubmit={refund.run}>
            <DialogBody className="space-y-4">
              <FormField<Values, "amount">
                name="amount"
                label="Amount"
                hint="A full refund voids the tickets and puts the inventory back on sale."
              >
                {(field) => <AffixInput {...field} prefix={currency} inputMode="decimal" />}
              </FormField>

              <FormField<Values, "reason"> name="reason" label="Reason">
                {(field) => <Textarea {...field} rows={2} placeholder="Customer request" />}
              </FormField>

              <FormError message={refund.error} />
            </DialogBody>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" loading={form.formState.isSubmitting}>
                Refund {formatMoney(previewCents, currency)}
              </Button>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
