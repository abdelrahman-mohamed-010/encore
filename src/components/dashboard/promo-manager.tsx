"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { createPromo } from "@/features/promos/actions";
import { useAsyncAction, useDebouncedSearchParam } from "@/hooks";
import { promoSchema, type PromoData, type PromoValues } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { AffixInput, Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Form, FormError, FormField } from "@/components/ui/form";
import { Card } from "@/components/ui/surface";
import { Shimmer } from "@/components/ui/skeleton";

/** Static shell: search + "New code". Server-driven — never a skeleton itself. */
export function PromoShell({
  organizerSlug,
  events,
  children,
}: {
  organizerSlug: string;
  events: { id: string; title: string }[];
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const [open, setOpen] = React.useState(searchParams.get("new") === "1");
  const { value: query, onChange: setQuery } = useDebouncedSearchParam("q");

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
    const result = await createPromo({ ...values, organizerSlug });
    if (result?.serverError) throw new Error(result.serverError);
    if (result?.validationErrors) throw new Error("Check the form and try again.");

    toast.success("Promo code created");
    setOpen(false);
    form.reset();
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
        key={searchParams.toString()}
        fallback={
          <Card className="overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border-b border-hairline-soft px-5 py-3.5 last:border-b-0">
                <Shimmer className="h-11 rounded-lg" />
              </div>
            ))}
          </Card>
        }
      >
        {children}
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
