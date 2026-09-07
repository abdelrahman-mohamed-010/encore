"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Search, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAsyncAction } from "@/hooks";
import { promoSchema, type PromoData, type PromoValues } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/surface";
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { AffixInput, Input, Switch } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Form, FormError, FormField } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/misc";
import { Shimmer } from "@/components/ui/skeleton";
import { formatMoney, formatNumber } from "@/lib/format";
import type { PromoCode } from "@/lib/types";

/** Static shell: search + "New code". Never a skeleton. */
export function PromoShell({
  organizerId,
  promosPromise,
  events,
}: {
  organizerId: string;
  promosPromise: PromiseLike<PromoCode[]>;
  events: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-56 max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search promo codes..."
            className="pl-9"
            aria-label="Search promo codes"
          />
        </div>

        <Button variant="solid" size="md" onClick={() => setOpen(true)}>
          <Plus /> New code
        </Button>
      </div>

      <React.Suspense
        fallback={
          <Card className="overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border-b border-hairline-soft px-4 py-3.5 last:border-b-0">
                <Shimmer className="h-11 rounded-lg" />
              </div>
            ))}
          </Card>
        }
      >
        <PromoRows promosPromise={promosPromise} query={query} onCreateFirst={() => setOpen(true)} />
      </React.Suspense>

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
                  {({ value, onChange, ...field }) => (
                    <SelectField
                      {...field}
                      value={value ?? "percentage"}
                      onChange={onChange}
                      options={[
                        { value: "percentage", label: "Percentage" },
                        { value: "fixed", label: "Fixed amount" },
                      ]}
                    />
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
                {({ value, onChange, ...field }) => (
                  <Combobox
                    {...field}
                    value={value ?? ""}
                    onChange={onChange}
                    clearable
                    placeholder="All of your events"
                    searchPlaceholder="Search events…"
                    options={events.map((event) => ({ value: event.id, label: event.title }))}
                  />
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

function PromoRows({
  promosPromise,
  query,
  onCreateFirst,
}: {
  promosPromise: PromiseLike<PromoCode[]>;
  query: string;
  onCreateFirst: () => void;
}) {
  const router = useRouter();
  const promos = React.use(promosPromise);
  const [, startTransition] = useTransition();

  const filteredPromos = useMemo(() => {
    if (!query.trim()) return promos;
    const q = query.toLowerCase().trim();
    return promos.filter((p) => p.code.toLowerCase().includes(q));
  }, [promos, query]);

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

  if (filteredPromos.length === 0) {
    return (
      <EmptyState
        icon={Tag}
        title={promos.length === 0 ? "No promo codes yet" : "No matching codes found"}
        description={
          promos.length === 0
            ? "Create a code to run a presale, a partner discount or a friends-and-family rate."
            : "Try adjusting your search query."
        }
        action={
          promos.length === 0 ? (
            <Button variant="solid" size="md" onClick={onCreateFirst}>
              <Plus /> New code
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <Card className="overflow-hidden">
      {filteredPromos.map((promo) => (
        <div
          key={promo.id}
          className="flex items-center gap-4 border-b border-hairline-soft px-4 py-3.5 last:border-b-0"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-base font-semibold text-ink">{promo.code}</span>
              <Badge tone={promo.is_active ? "positive" : "neutral"} size="xs">
                {promo.is_active ? "Active" : "Paused"}
              </Badge>
              {promo.event_id && <Badge tone="outline" size="xs">One event</Badge>}
            </div>
            <p className="mt-1 text-xs text-ink-3">
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
  );
}
