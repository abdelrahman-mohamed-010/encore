"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/surface";
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { AffixInput, Field, Input, Switch, Textarea, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState, Meter } from "@/components/ui/misc";
import { formatMoney, formatNumber } from "@/lib/format";
import type { SeatingType, TicketType } from "@/lib/types";

type Draft = {
  id?: string;
  name: string;
  description: string;
  priceMajor: string;
  quantityTotal: string;
  minPerOrder: string;
  maxPerOrder: string;
  isHidden: boolean;
};

const EMPTY: Draft = {
  name: "",
  description: "",
  priceMajor: "0",
  quantityTotal: "100",
  minPerOrder: "1",
  maxPerOrder: "10",
  isHidden: false,
};

function toDraft(tier: TicketType): Draft {
  return {
    id: tier.id,
    name: tier.name,
    description: tier.description ?? "",
    priceMajor: (tier.price_cents / 100).toFixed(2),
    quantityTotal: String(tier.quantity_total),
    minPerOrder: String(tier.min_per_order),
    maxPerOrder: String(tier.max_per_order),
    isHidden: tier.is_hidden,
  };
}

export function TicketTypeEditor({
  eventId,
  ticketTypes,
  seatingType,
}: {
  eventId: string;
  ticketTypes: TicketType[];
  seatingType: SeatingType;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  const currency = ticketTypes[0]?.currency ?? "USD";

  async function save() {
    if (!draft) return;
    setError(null);

    const price = Math.round(Number(draft.priceMajor) * 100);
    const quantity = Number(draft.quantityTotal);
    const min = Number(draft.minPerOrder);
    const max = Number(draft.maxPerOrder);

    if (draft.name.trim().length < 1) return setError("Give the ticket type a name.");
    if (!Number.isFinite(price) || price < 0) return setError("Enter a valid price.");
    if (!Number.isInteger(quantity) || quantity < 0) return setError("Enter a whole number of tickets.");
    if (max < min) return setError("The maximum per order cannot be below the minimum.");

    const existing = ticketTypes.find((t) => t.id === draft.id);
    if (existing && quantity < existing.quantity_sold + existing.quantity_reserved) {
      return setError(
        `You cannot go below ${existing.quantity_sold + existing.quantity_reserved} — that many are already sold or held.`,
      );
    }

    setSaving(true);
    const supabase = createClient();

    const payload = {
      event_id: eventId,
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      price_cents: price,
      quantity_total: quantity,
      min_per_order: min,
      max_per_order: max,
      is_hidden: draft.isHidden,
      sort_order: ticketTypes.length,
    };

    const { error: writeError } = draft.id
      ? await supabase.from("ticket_types").update(payload).eq("id", draft.id)
      : await supabase.from("ticket_types").insert(payload);

    setSaving(false);

    if (writeError) {
      setError(writeError.message);
      return;
    }

    toast.success(draft.id ? "Ticket type saved" : "Ticket type added");
    setDraft(null);
    router.refresh();
  }

  function remove(tier: TicketType) {
    if (tier.quantity_sold > 0) {
      toast.error("This ticket type has sales and cannot be deleted", {
        description: "Hide it instead so it stops appearing on the event page.",
      });
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("ticket_types").delete().eq("id", tier.id);
      if (error) {
        toast.error("Could not delete", { description: error.message });
        return;
      }
      toast.success("Ticket type deleted");
      router.refresh();
    });
  }

  return (
    <>
      <Card>
        <CardHeader bordered>
          <div>
            <CardTitle>Ticket types</CardTitle>
            {seatingType === "reserved_seating" && (
              <p className="mt-0.5 text-[12.5px] text-ink-3">
                This event uses reserved seating — each type maps to a seating section.
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => { setDraft({ ...EMPTY }); setError(null); }}>
            <Plus /> Add type
          </Button>
        </CardHeader>

        {ticketTypes.length === 0 ? (
          <CardBody>
            <EmptyState
              title="No ticket types yet"
              description="Add at least one before submitting the event for review."
              action={
                <Button variant="solid" size="sm" onClick={() => setDraft({ ...EMPTY })}>
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
                      <p className="text-[14px] font-medium text-ink">{tier.name}</p>
                      {tier.is_hidden && <Badge tone="neutral" size="xs">Hidden</Badge>}
                      {available === 0 && <Badge tone="critical" size="xs">Sold out</Badge>}
                    </div>
                    <p className="mt-1 text-[12.5px] text-ink-3">
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
                      onClick={() => { setDraft(toDraft(tier)); setError(null); }}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${tier.name}`}
                      onClick={() => remove(tier)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit ticket type" : "New ticket type"}</DialogTitle>
            <DialogDescription>
              Buyers see the name, price and how many are left.
            </DialogDescription>
          </DialogHeader>

          {draft && (
            <DialogBody className="space-y-4">
              <Field label="Name" htmlFor="ttName" required>
                <Input
                  id="ttName"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="General Admission"
                />
              </Field>

              <Field label="Description" htmlFor="ttDescription">
                <Textarea
                  id="ttDescription"
                  rows={2}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Price" htmlFor="ttPrice" hint="Use 0 for a free ticket.">
                  <AffixInput
                    id="ttPrice"
                    prefix={currency}
                    inputMode="decimal"
                    value={draft.priceMajor}
                    onChange={(e) => setDraft({ ...draft, priceMajor: e.target.value })}
                  />
                </Field>
                <Field label="Quantity" htmlFor="ttQuantity">
                  <Input
                    id="ttQuantity"
                    type="number"
                    min={0}
                    value={draft.quantityTotal}
                    onChange={(e) => setDraft({ ...draft, quantityTotal: e.target.value })}
                  />
                </Field>
                <Field label="Min per order" htmlFor="ttMin">
                  <Input
                    id="ttMin"
                    type="number"
                    min={1}
                    value={draft.minPerOrder}
                    onChange={(e) => setDraft({ ...draft, minPerOrder: e.target.value })}
                  />
                </Field>
                <Field label="Max per order" htmlFor="ttMax" error={error}>
                  <Input
                    id="ttMax"
                    type="number"
                    min={1}
                    value={draft.maxPerOrder}
                    onChange={(e) => setDraft({ ...draft, maxPerOrder: e.target.value })}
                    aria-invalid={Boolean(error)}
                  />
                </Field>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-lg border border-hairline bg-sunken px-3.5 py-3">
                <div>
                  <Label htmlFor="ttHidden">Hidden</Label>
                  <p className="mt-0.5 text-[12px] text-ink-3">
                    Keeps this tier off the public event page.
                  </p>
                </div>
                <Switch
                  checked={draft.isHidden}
                  onCheckedChange={(next) => setDraft({ ...draft, isHidden: next })}
                  label="Hidden"
                />
              </div>
            </DialogBody>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDraft(null)}>Cancel</Button>
            <Button variant="solid" loading={saving} onClick={save}>
              {draft?.id ? "Save changes" : "Add ticket type"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
