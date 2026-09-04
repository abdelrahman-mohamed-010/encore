"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAsyncAction } from "@/hooks";
import { promoSchema, type PromoData, type PromoValues } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Card, SectionHeader } from "@/components/ui/surface";
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { AffixInput, Input, Select, Switch } from "@/components/ui/input";
import { Form, FormError, FormField } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/misc";
import { formatMoney, formatNumber } from "@/lib/format";
import type { PromoCode } from "@/lib/types";

export function PromoManager({
  organizerId,
  promos,
  events,
}: {
  organizerId: string;
  promos: PromoCode[];
  events: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const form = useForm<PromoValues, unknown, PromoData>({
    resolver: zodResolver(promoSchema),
    defaultValues: {
      code: "",
      discountType: "percentage",
      value: "10",
      eventId: "",
      maxRedemptions: "",
      minOrder: "0",
    },
  });

  const discountType = useWatch({ control: form.control, name: "discountType" });

  const create = useAsyncAction(async (values: PromoData) => {
    const numeric = Number(values.value);
    const { error } = await createClient().from("promo_codes").insert({
      organizer_id: organizerId,
      event_id: values.eventId || null,
      code: values.code,
      discount_type: values.discountType,
      // Percentages are stored as typed; fixed amounts are stored in cents.
      discount_value: values.discountType === "percentage" ? numeric : Math.round(numeric * 100),
      max_redemptions: values.maxRedemptions ? Number(values.maxRedemptions) : null,
      min_order_cents: Math.round(Number(values.minOrder || 0) * 100),
    });

    if (error) {
      throw new Error(
        error.code === "23505" ? "You already have a code with that name." : error.message,
      );
    }

    toast.success("Promo code created");
    setOpen(false);
    form.reset();
    router.refresh();
  });

  function toggleActive(promo: PromoCode) {
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("promo_codes")
        .update({ is_active: !promo.is_active })
        .eq("id", promo.id);
      if (error) {
        toast.error("Could not update the code", { description: error.message });
        return;
      }
      router.refresh();
    });
  }

  function remove(promo: PromoCode) {
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("promo_codes").delete().eq("id", promo.id);
      if (error) {
        toast.error("Could not delete the code", { description: error.message });
        return;
      }
      toast.success("Promo code deleted");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        level={1}
        title="Promo codes"
        description="Discounts buyers can apply at checkout."
        action={
          <Button variant="solid" size="md" onClick={() => setOpen(true)}>
            <Plus /> New code
          </Button>
        }
      />

      {promos.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No promo codes yet"
          description="Create a code to run a presale, a partner discount or a friends-and-family rate."
          action={
            <Button variant="solid" size="md" onClick={() => setOpen(true)}>
              <Plus /> New code
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          {promos.map((promo) => (
            <div
              key={promo.id}
              className="flex items-center gap-4 border-b border-hairline-soft px-4 py-3.5 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[14px] font-semibold text-ink">{promo.code}</span>
                  <Badge tone={promo.is_active ? "positive" : "neutral"} size="xs">
                    {promo.is_active ? "Active" : "Paused"}
                  </Badge>
                  {promo.event_id && <Badge tone="outline" size="xs">One event</Badge>}
                </div>
                <p className="mt-1 text-[12.5px] text-ink-3">
                  {promo.discount_type === "percentage"
                    ? `${promo.discount_value}% off`
                    : `${formatMoney(Number(promo.discount_value))} off`}
                  {promo.min_order_cents > 0 && ` · min ${formatMoney(promo.min_order_cents)}`}
                  {" · "}
                  {formatNumber(promo.times_redeemed)} used
                  {promo.max_redemptions ? ` of ${formatNumber(promo.max_redemptions)}` : ""}
                </p>
              </div>

              <Switch
                checked={promo.is_active}
                onCheckedChange={() => toggleActive(promo)}
                label={`Toggle ${promo.code}`}
              />
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${promo.code}`}
                onClick={() => remove(promo)}
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>New promo code</DialogTitle>
            <DialogDescription>Buyers type this at checkout to get the discount.</DialogDescription>
          </DialogHeader>

          <Form form={form} onSubmit={create.run}>
            <DialogBody className="space-y-4">
              <FormField<PromoValues, "code"> name="code" label="Code" required hint="Letters, numbers, dashes and underscores.">
                {(field) => (
                  <Input
                    {...field}
                    placeholder="EARLYBIRD"
                    className="font-mono"
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                )}
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField<PromoValues, "discountType"> name="discountType" label="Discount type">
                  {(field) => (
                    <Select {...field}>
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed amount</option>
                    </Select>
                  )}
                </FormField>

                <FormField<PromoValues, "value"> name="value" label="Value">
                  {(field) => (
                    <AffixInput
                      {...field}
                      inputMode="decimal"
                      prefix={discountType === "fixed" ? "USD" : undefined}
                      suffix={discountType === "percentage" ? "%" : undefined}
                    />
                  )}
                </FormField>
              </div>

              <FormField<PromoValues, "eventId"> name="eventId" label="Applies to">
                {(field) => (
                  <Select {...field}>
                    <option value="">All of your events</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>{event.title}</option>
                    ))}
                  </Select>
                )}
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField<PromoValues, "maxRedemptions"> name="maxRedemptions" label="Redemption limit" hint="Blank for unlimited.">
                  {(field) => <Input {...field} type="number" min={1} />}
                </FormField>
                <FormField<PromoValues, "minOrder"> name="minOrder" label="Minimum order">
                  {(field) => <AffixInput {...field} prefix="USD" inputMode="decimal" />}
                </FormField>
              </div>

              <FormError message={create.error} />
            </DialogBody>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" variant="solid" loading={form.formState.isSubmitting}>
                Create code
              </Button>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
