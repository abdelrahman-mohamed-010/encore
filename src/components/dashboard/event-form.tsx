"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAsyncAction } from "@/hooks";
import { eventSchema, type EventData, type EventValues } from "@/lib/validation/event";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/surface";
import { Form, FormError, FormField } from "@/components/ui/form";
import { Input, Textarea, Switch, Label } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { DateTimeField, formatLocalDateTime } from "@/components/ui/date-picker";
import type { EventRow } from "@/lib/types";

type Option = { id: string; name: string; city?: string | null };

/** A stored UTC timestamp -> the "YYYY-MM-DDTHH:mm" wall-clock DateTimeField uses. */
function toLocalInput(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : formatLocalDateTime(date);
}

export function EventForm({
  organizerId,
  organizerSlug,
  categories,
  venues,
  event,
}: {
  organizerId: string;
  organizerSlug: string;
  categories: Option[];
  venues: Option[];
  event?: EventRow;
}) {
  const router = useRouter();
  const editing = Boolean(event);

  // One form object replaces the sixteen useState calls this component used to
  // carry. Validation — including the cross-field rules — lives in the schema,
  // which the API route reuses verbatim.
  const form = useForm<EventValues, unknown, EventData>({
    resolver: zodResolver(eventSchema),
    mode: "onBlur",
    defaultValues: {
      title: event?.title ?? "",
      subtitle: event?.subtitle ?? "",
      description: event?.description ?? "",
      categoryId: event?.category_id ?? "",
      venueId: event?.venue_id ?? "",
      isOnline: event?.is_online ?? false,
      onlineUrl: event?.online_url ?? "",
      startsAt: toLocalInput(event?.starts_at),
      endsAt: toLocalInput(event?.ends_at),
      coverImageUrl: event?.cover_image_url ?? "",
      tags: (event?.tags ?? []).join(", "),
      refundPolicy: event?.refund_policy ?? "",
      minAge: event?.min_age ? String(event.min_age) : "",
    },
  });

  const isOnline = useWatch({ control: form.control, name: "isOnline" });

  // `values` arrives already parsed and transformed by the schema, so there is
  // no second validation pass and no hand-rolled coercion here.
  const save = useAsyncAction(async (parsed: EventData) => {
    const supabase = createClient();

    const payload = {
      organizer_id: organizerId,
      title: parsed.title,
      subtitle: parsed.subtitle || null,
      description: parsed.description || null,
      category_id: parsed.categoryId || null,
      venue_id: parsed.isOnline ? null : parsed.venueId || null,
      is_online: parsed.isOnline,
      online_url: parsed.isOnline ? parsed.onlineUrl : null,
      starts_at: new Date(parsed.startsAt).toISOString(),
      ends_at: new Date(parsed.endsAt).toISOString(),
      cover_image_url: parsed.coverImageUrl || null,
      tags: parsed.tags,
      refund_policy: parsed.refundPolicy || null,
      min_age: parsed.minAge ? Number(parsed.minAge) : null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    const { data, error } = editing
      ? await supabase.from("events").update(payload).eq("id", event!.id).select("id").single()
      : await supabase.from("events").insert(payload).select("id").single();

    if (error) throw new Error(error.message);

    toast.success(editing ? "Event saved" : "Event created");
    router.push(`/dashboard/${organizerSlug}/events/${data.id}`);
    router.refresh();
  });

  return (
    <Form form={form} onSubmit={save.run} className="space-y-5">
      <Card>
        <CardHeader bordered className="flex-col items-start">
          <CardTitle>Basics</CardTitle>
          <CardDescription>What the event is and when it happens.</CardDescription>
        </CardHeader>

        <CardBody className="space-y-5">
          <FormField<EventValues, "title"> name="title" label="Title" required>
            {(field) => <Input {...field} placeholder="Cairokee — Roots Live" />}
          </FormField>

          <FormField<EventValues, "subtitle"> name="subtitle" label="Tagline" hint="One line shown under the title.">
            {(field) => <Input {...field} placeholder="The full band, one night only." />}
          </FormField>

          <FormField<EventValues, "description"> name="description" label="Description" hint="Blank lines separate paragraphs.">
            {(field) => <Textarea {...field} rows={6} />}
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField<EventValues, "startsAt"> name="startsAt" label="Starts" required>
              {({ value, onChange, onBlur, ...field }) => (
                <DateTimeField {...field} value={value ?? ""} onChange={onChange} onBlur={onBlur} />
              )}
            </FormField>
            <FormField<EventValues, "endsAt"> name="endsAt" label="Ends" required>
              {({ value, onChange, onBlur, ...field }) => (
                <DateTimeField {...field} value={value ?? ""} onChange={onChange} onBlur={onBlur} />
              )}
            </FormField>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader bordered className="flex-col items-start">
          <CardTitle>Where</CardTitle>
          <CardDescription>A physical venue, or an online joining link.</CardDescription>
        </CardHeader>

        <CardBody className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label>Online event</Label>
              <p className="mt-0.5 text-xs text-ink-3">
                Attendees get a link instead of a venue address.
              </p>
            </div>
            <Switch
              checked={isOnline}
              onCheckedChange={(next) => form.setValue("isOnline", next, { shouldValidate: true })}
              label="Online event"
            />
          </div>

          {isOnline ? (
            <FormField<EventValues, "onlineUrl"> name="onlineUrl" label="Joining link" required>
              {(field) => <Input {...field} type="url" placeholder="https://meet.example.com/…" />}
            </FormField>
          ) : (
            <FormField<EventValues, "venueId"> name="venueId" label="Venue" required>
              {({ value, onChange, ...field }) => (
                <Combobox
                  {...field}
                  value={value ?? ""}
                  onChange={onChange}
                  placeholder="Choose a venue…"
                  searchPlaceholder="Search venues…"
                  emptyMessage="No venue matches."
                  options={venues.map((venue) => ({
                    value: venue.id,
                    label: venue.name,
                    hint: venue.city ?? undefined,
                    keywords: venue.city ?? "",
                  }))}
                />
              )}
            </FormField>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader bordered className="flex-col items-start">
          <CardTitle>Details</CardTitle>
          <CardDescription>How the event is categorised and presented.</CardDescription>
        </CardHeader>

        <CardBody className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField<EventValues, "categoryId"> name="categoryId" label="Category">
              {({ value, onChange, ...field }) => (
                <Combobox
                  {...field}
                  value={value ?? ""}
                  onChange={onChange}
                  clearable
                  placeholder="Uncategorised"
                  searchPlaceholder="Search categories…"
                  options={categories.map((category) => ({
                    value: category.id,
                    label: category.name,
                  }))}
                />
              )}
            </FormField>

            <FormField<EventValues, "minAge"> name="minAge" label="Minimum age" hint="Leave blank for all ages.">
              {(field) => <Input {...field} type="number" min={0} max={120} />}
            </FormField>
          </div>

          <FormField<EventValues, "coverImageUrl"> name="coverImageUrl" label="Cover image URL" hint="A wide image works best (16:10).">
            {(field) => <Input {...field} placeholder="https://…" />}
          </FormField>

          <FormField<EventValues, "tags"> name="tags" label="Tags" hint="Comma separated. Helps people find the event.">
            {(field) => <Input {...field} placeholder="rock, live, arabic" />}
          </FormField>

          <FormField<EventValues, "refundPolicy"> name="refundPolicy" label="Refund policy">
            {(field) => <Textarea {...field} rows={2} placeholder="Full refunds up to 7 days before the event." />}
          </FormField>

          <FormError message={save.error} />
        </CardBody>

        <CardFooter className="justify-end">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" variant="solid" loading={form.formState.isSubmitting || save.pending}>
            {editing ? "Save changes" : "Create event"}
          </Button>
        </CardFooter>
      </Card>
    </Form>
  );
}
