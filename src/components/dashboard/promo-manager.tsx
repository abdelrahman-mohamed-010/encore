"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, SectionHeader } from "@/components/ui/surface";
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { AffixInput, Field, Input, Select, Switch } from "@/components/ui/input";
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
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percentage" | "fixed">("percentage");
  const [value, setValue] = useState("10");
  const [eventId, setEventId] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [minOrder, setMinOrder] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  async function create() {
    setError(null);
    const numeric = Number(value);

    if (code.trim().length < 3) return setError("Codes need at least 3 characters.");
    if (!Number.isFinite(numeric) || numeric <= 0) return setError("Enter a discount above zero.");
    if (type === "percentage" && numeric > 100) return setError("A percentage cannot exceed 100.");

    setSaving(true);
    const supabase = createClient();
    const { error: writeError } = await supabase.from("promo_codes").insert({
      organizer_id: organizerId,
      event_id: eventId || null,
      code: code.trim().toUpperCase(),
      discount_type: type,
      // Percentages are stored as-is; fixed amounts are stored in cents.
      discount_value: type === "percentage" ? numeric : Math.round(numeric * 100),
      max_redemptions: maxRedemptions ? Number(maxRedemptions) : null,
      min_order_cents: Math.round(Number(minOrder || 0) * 100),
    });
    setSaving(false);

    if (writeError) {
      setError(
        writeError.code === "23505" ? "You already have a code with that name." : writeError.message,
      );
      return;
    }

    toast.success("Promo code created");
    setOpen(false);
    setCode("");
    router.refresh();
  }

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

          <DialogBody className="space-y-4">
            <Field label="Code" htmlFor="promoCode" required hint="Letters and numbers work best.">
              <Input
                id="promoCode"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="EARLYBIRD"
                className="font-mono"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Discount type" htmlFor="promoType">
                <Select
                  id="promoType"
                  value={type}
                  onChange={(e) => setType(e.target.value as "percentage" | "fixed")}
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed amount</option>
                </Select>
              </Field>

              <Field label="Value" htmlFor="promoValue">
                <AffixInput
                  id="promoValue"
                  inputMode="decimal"
                  prefix={type === "fixed" ? "USD" : undefined}
                  suffix={type === "percentage" ? "%" : undefined}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </Field>
            </div>

            <Field label="Applies to" htmlFor="promoEvent">
              <Select id="promoEvent" value={eventId} onChange={(e) => setEventId(e.target.value)}>
                <option value="">All of your events</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>{event.title}</option>
                ))}
              </Select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Redemption limit" htmlFor="promoMax" hint="Blank for unlimited.">
                <Input
                  id="promoMax"
                  type="number"
                  min={1}
                  value={maxRedemptions}
                  onChange={(e) => setMaxRedemptions(e.target.value)}
                />
              </Field>
              <Field label="Minimum order" htmlFor="promoMin" error={error}>
                <AffixInput
                  id="promoMin"
                  prefix="USD"
                  inputMode="decimal"
                  value={minOrder}
                  onChange={(e) => setMinOrder(e.target.value)}
                  aria-invalid={Boolean(error)}
                />
              </Field>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="solid" loading={saving} onClick={create}>Create code</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
