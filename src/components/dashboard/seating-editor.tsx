"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Armchair, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAsyncAction } from "@/hooks";
import { seatingSchema, type SeatingData, type SeatingValues } from "@/lib/validation";
import { generateSeats, sectionCode, type SectionSpec } from "@/lib/seat-layout";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/surface";
import { Form, FormError, FormField } from "@/components/ui/form";
import { AffixInput, Input } from "@/components/ui/input";
import { ColorPicker } from "@/components/ui/color-picker";
import { EmptyState } from "@/components/ui/misc";
import { SeatMapPreviewButton } from "@/components/dashboard/seat-map-preview";
import { formatMoney, formatNumber } from "@/lib/format";
import type { SeatingType } from "@/lib/types";

const PALETTE = ["#8b5cf6", "#0ea5e9", "#f59e0b", "#10b981", "#ec4899", "#6366f1"];

const blankSection = (index: number): SeatingValues["sections"][number] => ({
  name: "",
  color: PALETTE[index % PALETTE.length],
  rows: "10",
  seatsPerRow: "16",
  price: "50",
});

export type SeatingSection = {
  id: string;
  name: string;
  color: string;
  seats: number;
};

/**
 * Setting up reserved seating for an event.
 *
 * A venue manager describes the house the way they think about it — sections,
 * each so many rows by so many seats, at a price — and this builds the three
 * things the checkout already expects: the venue's seat map, a ticket type per
 * section, and the per-event seat inventory that `create_reservation` locks.
 * Until now those rows could only be written by hand in SQL.
 */
export function SeatingEditor({
  eventId,
  seatingType,
  venue,
  sections,
  ticketTypeCount,
  soldOrHeld,
}: {
  eventId: string;
  seatingType: SeatingType;
  venue: { id: string; name: string } | null;
  /** Sections already on the venue, with how many seats each holds. */
  sections: SeatingSection[];
  ticketTypeCount: number;
  /** Seats already sold or held; setting up again would strand them. */
  soldOrHeld: number;
}) {
  const router = useRouter();
  const [building, setBuilding] = useState(false);

  const form = useForm<SeatingValues, unknown, SeatingData>({
    resolver: zodResolver(seatingSchema),
    defaultValues: { sections: [blankSection(0)] },
  });
  const fields = useFieldArray({ control: form.control, name: "sections" });
  const watched = useWatch({ control: form.control, name: "sections" });

  const totalSeats = useMemo(
    () =>
      (watched ?? []).reduce(
        (sum, section) => sum + (Number(section?.rows) || 0) * (Number(section?.seatsPerRow) || 0),
        0,
      ),
    [watched],
  );

  const isReserved = seatingType === "reserved_seating";
  const venueSeats = sections.reduce((sum, section) => sum + section.seats, 0);

  const build = useAsyncAction(async (values: SeatingData) => {
    if (!venue) throw new Error("Choose a venue for this event first.");

    const supabase = createClient();
    const specs: SectionSpec[] = values.sections.map((section) => ({
      name: section.name,
      color: section.color,
      rows: Number(section.rows),
      seatsPerRow: Number(section.seatsPerRow),
      priceCents: Math.round(Number(section.price) * 100),
    }));

    // There is no transaction across these calls, so anything created is
    // tracked and torn down if a later step fails. Deleting a section cascades
    // to its seats and their event_seats; ticket types detach instead, so they
    // are removed explicitly.
    const createdSections: string[] = [];
    const createdTicketTypes: string[] = [];

    setBuilding(true);
    try {
      const generated = generateSeats(specs);

      for (const [index, { section, seats }] of generated.entries()) {
        const { data: sectionRow, error: sectionError } = await supabase
          .from("venue_sections")
          .insert({
            venue_id: venue.id,
            name: section.name,
            code: sectionCode(section.name, index),
            color: section.color,
            sort_order: index,
          })
          .select("id")
          .single();
        if (sectionError) throw new Error(sectionError.message);
        createdSections.push(sectionRow.id);

        const { data: ticketType, error: typeError } = await supabase
          .from("ticket_types")
          .insert({
            event_id: eventId,
            section_id: sectionRow.id,
            name: section.name,
            price_cents: section.priceCents,
            quantity_total: seats.length,
            sort_order: ticketTypeCount + index,
          })
          .select("id")
          .single();
        if (typeError) throw new Error(typeError.message);
        createdTicketTypes.push(ticketType.id);

        const { data: seatRows, error: seatError } = await supabase
          .from("venue_seats")
          .insert(
            seats.map((seat) => ({
              venue_id: venue.id,
              section_id: sectionRow.id,
              row_label: seat.rowLabel,
              seat_number: seat.seatNumber,
              pos_x: seat.posX,
              pos_y: seat.posY,
            })),
          )
          .select("id");
        if (seatError) throw new Error(seatError.message);

        const { error: inventoryError } = await supabase.from("event_seats").insert(
          (seatRows ?? []).map((seat) => ({
            event_id: eventId,
            seat_id: seat.id,
            ticket_type_id: ticketType.id,
          })),
        );
        if (inventoryError) throw new Error(inventoryError.message);
      }

      // Only flip the event once its inventory exists, so the public page never
      // renders a reserved-seating event with no seats to pick.
      const { error: eventError } = await supabase
        .from("events")
        .update({ seating_type: "reserved_seating" })
        .eq("id", eventId);
      if (eventError) throw new Error(eventError.message);

      await supabase.from("venues").update({ seating_type: "reserved_seating" }).eq("id", venue.id);

      toast.success(`Seat map created — ${formatNumber(totalSeats)} seats`);
      router.refresh();
    } catch (error) {
      if (createdTicketTypes.length) {
        await supabase.from("ticket_types").delete().in("id", createdTicketTypes);
      }
      if (createdSections.length) {
        await supabase.from("venue_sections").delete().in("id", createdSections);
      }
      throw error;
    } finally {
      setBuilding(false);
    }
  });

  /** Point the event back at plain quantity-based tickets. */
  const useExisting = useAsyncAction(async () => {
    if (!venue) return;
    const supabase = createClient();

    const { data: seats, error } = await supabase
      .from("venue_seats")
      .select("id, section_id")
      .eq("venue_id", venue.id);
    if (error) throw new Error(error.message);

    const { data: types, error: typeError } = await supabase
      .from("ticket_types")
      .select("id, section_id")
      .eq("event_id", eventId)
      .not("section_id", "is", null);
    if (typeError) throw new Error(typeError.message);

    const typeBySection = new Map((types ?? []).map((type) => [type.section_id, type.id]));
    const missing = (seats ?? []).filter((seat) => !typeBySection.has(seat.section_id));
    if (missing.length > 0) {
      throw new Error(
        "Some sections have no ticket type on this event yet. Add one per section first.",
      );
    }

    const { error: insertError } = await supabase.from("event_seats").insert(
      (seats ?? []).map((seat) => ({
        event_id: eventId,
        seat_id: seat.id,
        ticket_type_id: typeBySection.get(seat.section_id)!,
      })),
    );
    if (insertError) throw new Error(insertError.message);

    const { error: eventError } = await supabase
      .from("events")
      .update({ seating_type: "reserved_seating" })
      .eq("id", eventId);
    if (eventError) throw new Error(eventError.message);

    toast.success("This event now uses the venue's seat map");
    router.refresh();
  });

  // ---- Already seated ------------------------------------------------------
  if (isReserved) {
    return (
      <Card>
        <CardHeader bordered>
          <div>
            <CardTitle>Seating</CardTitle>
            <CardDescription>
              {formatNumber(venueSeats)} seats at {venue?.name ?? "this venue"}.
            </CardDescription>
          </div>
          <SeatMapPreviewButton eventId={eventId} venueName={venue?.name ?? "this venue"} />
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {sections.map((section) => (
              <div key={section.id} className="flex items-center gap-2">
                <span
                  className="size-3 rounded-[3px]"
                  style={{
                    backgroundColor: `${section.color}33`,
                    boxShadow: `inset 0 0 0 1.5px ${section.color}`,
                  }}
                />
                <span className="text-sm font-medium text-ink">{section.name}</span>
                <span className="text-sm tabular text-ink-3">
                  {formatNumber(section.seats)} seats
                </span>
              </div>
            ))}
          </div>
          {soldOrHeld > 0 && (
            <p className="mt-4 text-xs text-ink-3">
              {formatNumber(soldOrHeld)} of these are sold or on hold.
            </p>
          )}
        </CardBody>
      </Card>
    );
  }

  // ---- No venue ------------------------------------------------------------
  if (!venue) {
    return (
      <Card>
        <CardHeader bordered className="flex-col items-start">
          <CardTitle>Seating</CardTitle>
          <CardDescription>Reserved seating needs a venue to lay the seats out in.</CardDescription>
        </CardHeader>
        <CardBody>
          <EmptyState
            icon={Armchair}
            title="No venue on this event"
            description="Choose a venue in Edit details, then come back to build its seat map."
          />
        </CardBody>
      </Card>
    );
  }

  // ---- The venue already has a map; reuse it -------------------------------
  if (sections.length > 0) {
    return (
      <Card>
        <CardHeader bordered className="flex-col items-start">
          <CardTitle>Seating</CardTitle>
          <CardDescription>
            {venue.name} already has a seat map — {formatNumber(venueSeats)} seats across{" "}
            {sections.length} sections.
          </CardDescription>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-sm text-ink-2">
            Switch this event to reserved seating and buyers will pick their own seats from that
            map. Each section needs a ticket type on this event to price it.
          </p>
          <FormError message={useExisting.error} />
          <Button
            variant="solid"
            loading={useExisting.pending}
            onClick={() => useExisting.run()}
          >
            <Armchair /> Use this seat map
          </Button>
        </CardBody>
      </Card>
    );
  }

  // ---- Build one from scratch ---------------------------------------------
  return (
    <Card>
      <CardHeader bordered className="flex-col items-start">
        <CardTitle>Seating</CardTitle>
        <CardDescription>
          Describe {venue.name} as sections of rows and seats. This creates the venue&apos;s seat
          map, a ticket type for each section, and this event&apos;s seat inventory.
        </CardDescription>
      </CardHeader>

      <Form form={form} onSubmit={build.run}>
        <CardBody className="space-y-4">
          {fields.fields.map((field, index) => (
            <div
              key={field.id}
              className="grid gap-3 rounded-xl bg-sunken p-3.5 sm:grid-cols-[1fr_auto_5rem_5rem_7rem_auto] sm:items-end"
            >
              <FormField<SeatingValues, `sections.${number}.name`>
                name={`sections.${index}.name`}
                label={index === 0 ? "Section" : undefined}
              >
                {(f) => (
                  <Input
                    {...f}
                    placeholder="Orchestra"
                    aria-label={`Section ${index + 1} name`}
                    className="bg-card"
                  />
                )}
              </FormField>

              <FormField<SeatingValues, `sections.${number}.color`>
                name={`sections.${index}.color`}
                label={index === 0 ? "Colour" : undefined}
              >
                {({ value, onChange, onBlur }) => (
                  <ColorPicker
                    value={value ?? PALETTE[0]}
                    onChange={onChange}
                    onBlur={onBlur}
                    swatches={PALETTE}
                  />
                )}
              </FormField>

              <FormField<SeatingValues, `sections.${number}.rows`>
                name={`sections.${index}.rows`}
                label={index === 0 ? "Rows" : undefined}
              >
                {(f) => (
                  <Input
                    {...f}
                    type="number"
                    min={1}
                    aria-label={`Section ${index + 1} rows`}
                    className="bg-card"
                  />
                )}
              </FormField>

              <FormField<SeatingValues, `sections.${number}.seatsPerRow`>
                name={`sections.${index}.seatsPerRow`}
                label={index === 0 ? "Per row" : undefined}
              >
                {(f) => (
                  <Input
                    {...f}
                    type="number"
                    min={1}
                    aria-label={`Section ${index + 1} seats per row`}
                    className="bg-card"
                  />
                )}
              </FormField>

              <FormField<SeatingValues, `sections.${number}.price`>
                name={`sections.${index}.price`}
                label={index === 0 ? "Price" : undefined}
              >
                {(f) => (
                  <AffixInput
                    {...f}
                    prefix="$"
                    inputMode="decimal"
                    aria-label={`Section ${index + 1} price`}
                    className="bg-card"
                  />
                )}
              </FormField>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove section ${index + 1}`}
                disabled={fields.fields.length === 1}
                onClick={() => fields.remove(index)}
              >
                <Trash2 />
              </Button>
            </div>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fields.append(blankSection(fields.fields.length))}
            >
              <Plus /> Add section
            </Button>
            <p className="text-sm text-ink-3">
              {formatNumber(totalSeats)} seats
              {totalSeats > 0 && (
                <>
                  {" · "}
                  up to{" "}
                  <span className="tabular text-ink-2">
                    {formatMoney(
                      (watched ?? []).reduce(
                        (sum, section) =>
                          sum +
                          Math.round((Number(section?.price) || 0) * 100) *
                            (Number(section?.rows) || 0) *
                            (Number(section?.seatsPerRow) || 0),
                        0,
                      ),
                      "USD",
                    )}
                  </span>{" "}
                  gross
                </>
              )}
            </p>
          </div>

          <FormError message={build.error} />
          {form.formState.errors.sections?.root && (
            <FormError message={form.formState.errors.sections.root.message} />
          )}

          <div>
            <Button type="submit" variant="solid" loading={build.pending || building}>
              <Armchair /> Create seat map
            </Button>
            <p className="mt-2 text-xs text-ink-3">
              Buyers pick their seats from the map. Any ticket type without a section — standing,
              livestream — still sells by quantity, in the same basket.
            </p>
          </div>
        </CardBody>
      </Form>
    </Card>
  );
}
