"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import { deleteTicketType, saveTicketType } from "@/features/events/actions";
import { useAsyncAction } from "@/hooks";
import { ticketTypeSchema, type TicketTypeData, type TicketTypeValues } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/surface";
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { AffixInput, Input, Switch, Textarea, Label } from "@/components/ui/input";
import { Form, FormError, FormField } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";
import { EmptyState, Meter } from "@/components/ui/misc";
import { formatMoney, formatNumber } from "@/lib/format";
import type { SeatingType, TicketType } from "@/lib/types";

const EMPTY: TicketTypeValues = {
  name: "",
  description: "",
  price: "0",
  quantityTotal: "100",
  minPerOrder: "1",
  maxPerOrder: "10",
  isHidden: false,
  sectionId: "",
};

function toValues(tier: TicketType): TicketTypeValues {
  return {
    name: tier.name,
    description: tier.description ?? "",
    price: (tier.price_cents / 100).toFixed(2),
    quantityTotal: String(tier.quantity_total),
    minPerOrder: String(tier.min_per_order),
    maxPerOrder: String(tier.max_per_order),
    isHidden: tier.is_hidden,
    sectionId: tier.section_id ?? "",
  };
}

export function TicketTypeEditor({
  eventId,
  organizerSlug,
  ticketTypes,
  seatingType,
  sections = [],
}: {
  eventId: string;
  organizerSlug: string;
  ticketTypes: TicketType[];
  seatingType: SeatingType;
  /** The venue's seating sections, when it has a seat map. */
  sections?: { id: string; name: string }[];
}) {
  // `editing` holds which tier the dialog is bound to: null = closed,
  // "new" = creating. The field values themselves live in the form.
  const [editing, setEditing] = useState<TicketType | "new" | null>(null);

  const currency = ticketTypes[0]?.currency ?? "USD";

  const form = useForm<TicketTypeValues, unknown, TicketTypeData>({
    resolver: zodResolver(ticketTypeSchema),
    defaultValues: EMPTY,
  });

  // Refill the form whenever the dialog is pointed at a different tier.
  useEffect(() => {
    if (editing === null) return;
    form.reset(editing === "new" ? EMPTY : toValues(editing));
  }, [editing, form]);

  const save = useAsyncAction(async (values: TicketTypeData) => {
    const existing = editing !== "new" && editing !== null ? editing : null;

    const result = await saveTicketType({
      ...values,
      eventId,
      organizerSlug,
      id: existing?.id,
      sortOrder: existing?.sort_order ?? ticketTypes.length,
    });

    if (result?.serverError) throw new Error(result.serverError);
    if (!result?.data && result?.validationErrors) {
      throw new Error("Check the form and try again.");
    }

    toast.success(existing ? "Ticket type saved" : "Ticket type added");
    setEditing(null);
  });

  const removeAction = useAction(deleteTicketType, {
    onSuccess: () => toast.success("Ticket type deleted"),
    onError: ({ error }) => toast.error("Could not delete", { description: error.serverError }),
  });

  async function remove(tier: TicketType) {
    if (tier.quantity_sold > 0) {
      toast.error("This ticket type has sales and cannot be deleted", {
        description: "Hide it instead so it stops appearing on the event page.",
      });
      return;
    }
    await removeAction.executeAsync({ id: tier.id, eventId, organizerSlug });
  }

  return (
    <>
      <Card>
        <CardHeader bordered>
          <div>
            <CardTitle>Ticket types</CardTitle>
            {seatingType === "reserved_seating" && (
              <p className="mt-0.5 text-xs text-ink-3">
                This event uses reserved seating — each type maps to a seating section.
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditing("new")}>
            <Plus /> Add type
          </Button>
        </CardHeader>

        {ticketTypes.length === 0 ? (
          <CardBody>
            <EmptyState
              title="No ticket types yet"
              description="Add at least one before submitting the event for review."
              action={
                <Button variant="solid" size="sm" onClick={() => setEditing("new")}>
                  <Plus /> Add ticket type
                </Button>
              }
            />
          </CardBody>
        ) : (
          <div>
            {ticketTypes.map((tier) => {
              const available = Math.max(
                0,
                tier.quantity_total - tier.quantity_sold - tier.quantity_reserved,
              );
              return (
                <div
                  key={tier.id}
                  className="flex items-center gap-4 border-b border-hairline-soft px-5 py-4 last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-medium text-ink">{tier.name}</p>
                      {tier.is_hidden && <Badge tone="neutral" size="xs">Hidden</Badge>}
                      {available === 0 && <Badge tone="critical" size="xs">Sold out</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-ink-3">
                      {tier.price_cents === 0 ? "Free" : formatMoney(tier.price_cents, tier.currency)}
                      {" · "}
                      {formatNumber(tier.quantity_sold)} sold, {formatNumber(available)} left
                    </p>
                    <Meter
                      value={tier.quantity_sold}
                      max={tier.quantity_total || 1}
                      className="mt-2 max-w-56"
                    />
                  </div>

                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit ${tier.name}`}
                      onClick={() => setEditing(tier)}
                    >
                      <Pencil />
                    </Button>
                    <ConfirmDialog
                      trigger={
                        <Button variant="ghost" size="icon-sm" aria-label={`Delete ${tier.name}`}>
                          <Trash2 />
                        </Button>
                      }
                      title={`Delete ${tier.name}?`}
                      description={
                        tier.quantity_sold > 0
                          ? "This type already has sales, so it can't be deleted — hide it instead so it stops appearing on the event page."
                          : "Buyers will no longer be able to select this ticket type. This can't be undone."
                      }
                      confirmLabel={tier.quantity_sold > 0 ? "Hide instead" : "Delete type"}
                      destructive={tier.quantity_sold === 0}
                      onConfirm={() =>
                        tier.quantity_sold > 0
                          ? Promise.resolve(setEditing(tier))
                          : remove(tier)
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing && editing !== "new" ? "Edit ticket type" : "New ticket type"}</DialogTitle>
            <DialogDescription>
              Buyers see the name, price and how many are left.
            </DialogDescription>
          </DialogHeader>

          <Form form={form} onSubmit={save.run}>
            <DialogBody className="space-y-4">
              <FormField<TicketTypeValues, "name"> name="name" label="Name" required>
                {(field) => <Input {...field} placeholder="General Admission" />}
              </FormField>

              <FormField<TicketTypeValues, "description"> name="description" label="Description">
                {(field) => <Textarea {...field} rows={2} />}
              </FormField>

              {sections.length > 0 && (
                <FormField<TicketTypeValues, "sectionId">
                  name="sectionId"
                  label="Seating section"
                  hint="Seats in this section are sold at this price. Leave blank for a tier with no seats."
                >
                  {({ value, onChange, ...field }) => (
                    <Combobox
                      {...field}
                      value={value ?? ""}
                      onChange={onChange}
                      clearable
                      placeholder="No section"
                      searchPlaceholder="Search sections…"
                      options={sections.map((section) => ({
                        value: section.id,
                        label: section.name,
                      }))}
                    />
                  )}
                </FormField>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField<TicketTypeValues, "price"> name="price" label="Price" hint="Use 0 for a free ticket.">
                  {(field) => <AffixInput {...field} prefix={currency} inputMode="decimal" />}
                </FormField>
                <FormField<TicketTypeValues, "quantityTotal"> name="quantityTotal" label="Quantity">
                  {(field) => <Input {...field} type="number" min={0} />}
                </FormField>
                <FormField<TicketTypeValues, "minPerOrder"> name="minPerOrder" label="Min per order">
                  {(field) => <Input {...field} type="number" min={1} />}
                </FormField>
                <FormField<TicketTypeValues, "maxPerOrder"> name="maxPerOrder" label="Max per order">
                  {(field) => <Input {...field} type="number" min={1} />}
                </FormField>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-lg border border-hairline bg-sunken px-3.5 py-3">
                <div>
                  <Label>Hidden</Label>
                  <p className="mt-0.5 text-xs text-ink-3">
                    Keeps this tier off the public event page.
                  </p>
                </div>
                <Switch
                  checked={useWatch({ control: form.control, name: "isHidden" })}
                  onCheckedChange={(next) => form.setValue("isHidden", next)}
                  label="Hidden"
                />
              </div>

              <FormError message={save.error} />
            </DialogBody>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" variant="solid" loading={form.formState.isSubmitting}>
                {editing && editing !== "new" ? "Save changes" : "Add ticket type"}
              </Button>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
