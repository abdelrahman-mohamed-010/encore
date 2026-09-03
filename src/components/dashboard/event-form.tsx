"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/surface";
import { Field, Input, Select, Textarea, Switch, Label } from "@/components/ui/input";
import type { EventRow } from "@/lib/types";

type Option = { id: string; name: string; city?: string | null };

/** `datetime-local` needs "YYYY-MM-DDTHH:mm" in local time. */
function toLocalInput(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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

  const [title, setTitle] = useState(event?.title ?? "");
  const [subtitle, setSubtitle] = useState(event?.subtitle ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [categoryId, setCategoryId] = useState(event?.category_id ?? "");
  const [venueId, setVenueId] = useState(event?.venue_id ?? "");
  const [isOnline, setIsOnline] = useState(event?.is_online ?? false);
  const [onlineUrl, setOnlineUrl] = useState(event?.online_url ?? "");
  const [startsAt, setStartsAt] = useState(toLocalInput(event?.starts_at));
  const [endsAt, setEndsAt] = useState(toLocalInput(event?.ends_at));
  const [coverImageUrl, setCoverImageUrl] = useState(event?.cover_image_url ?? "");
  const [tags, setTags] = useState((event?.tags ?? []).join(", "));
  const [refundPolicy, setRefundPolicy] = useState(event?.refund_policy ?? "");
  const [minAge, setMinAge] = useState(event?.min_age ? String(event.min_age) : "");

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    setError(null);

    if (title.trim().length < 3) return setError("Give the event a title of at least 3 characters.");
    if (!startsAt || !endsAt) return setError("Set when the event starts and ends.");
    if (new Date(endsAt) <= new Date(startsAt)) return setError("The end time must be after the start time.");
    if (!isOnline && !venueId) return setError("Choose a venue, or mark the event as online.");
    if (isOnline && !onlineUrl.trim()) return setError("Add the joining link for an online event.");

    setSaving(true);
    const supabase = createClient();

    const payload = {
      organizer_id: organizerId,
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      description: description.trim() || null,
      category_id: categoryId || null,
      venue_id: isOnline ? null : venueId || null,
      is_online: isOnline,
      online_url: isOnline ? onlineUrl.trim() : null,
      starts_at: new Date(startsAt).toISOString(),
      ends_at: new Date(endsAt).toISOString(),
      cover_image_url: coverImageUrl.trim() || null,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      refund_policy: refundPolicy.trim() || null,
      min_age: minAge ? Number(minAge) : null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    const { data, error } = editing
      ? await supabase.from("events").update(payload).eq("id", event!.id).select("id").single()
      : await supabase.from("events").insert(payload).select("id").single();

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    toast.success(editing ? "Event saved" : "Event created");
    router.push(`/dashboard/${organizerSlug}/events/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Card>
        <CardHeader bordered className="flex-col items-start">
          <CardTitle>Basics</CardTitle>
          <CardDescription>What the event is and when it happens.</CardDescription>
        </CardHeader>

        <CardBody className="space-y-5">
          <Field label="Title" htmlFor="title" required>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Cairokee — Roots Live"
              required
            />
          </Field>

          <Field label="Tagline" htmlFor="subtitle" hint="One line shown under the title.">
            <Input
              id="subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="The full band, one night only."
            />
          </Field>

          <Field label="Description" htmlFor="description" hint="Blank lines separate paragraphs.">
            <Textarea
              id="description"
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Starts" htmlFor="startsAt" required>
              <Input
                id="startsAt"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
              />
            </Field>
            <Field label="Ends" htmlFor="endsAt" required>
              <Input
                id="endsAt"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                required
              />
            </Field>
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
              <Label htmlFor="isOnline">Online event</Label>
              <p className="mt-0.5 text-[12.5px] text-ink-3">
                Attendees get a link instead of a venue address.
              </p>
            </div>
            <Switch checked={isOnline} onCheckedChange={setIsOnline} label="Online event" />
          </div>

          {isOnline ? (
            <Field label="Joining link" htmlFor="onlineUrl" required>
              <Input
                id="onlineUrl"
                type="url"
                value={onlineUrl}
                onChange={(e) => setOnlineUrl(e.target.value)}
                placeholder="https://meet.example.com/…"
              />
            </Field>
          ) : (
            <Field label="Venue" htmlFor="venueId" required>
              <Select id="venueId" value={venueId} onChange={(e) => setVenueId(e.target.value)}>
                <option value="">Choose a venue…</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}
                    {venue.city ? ` — ${venue.city}` : ""}
                  </option>
                ))}
              </Select>
            </Field>
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
            <Field label="Category" htmlFor="categoryId">
              <Select id="categoryId" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Uncategorised</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </Select>
            </Field>

            <Field label="Minimum age" htmlFor="minAge" hint="Leave blank for all ages.">
              <Input
                id="minAge"
                type="number"
                min={0}
                max={120}
                value={minAge}
                onChange={(e) => setMinAge(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Cover image URL" htmlFor="coverImageUrl" hint="A wide image works best (16:10).">
            <Input
              id="coverImageUrl"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="https://…"
            />
          </Field>

          <Field label="Tags" htmlFor="tags" hint="Comma separated. Helps people find the event.">
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="rock, live, arabic"
            />
          </Field>

          <Field label="Refund policy" htmlFor="refundPolicy" error={error}>
            <Textarea
              id="refundPolicy"
              rows={2}
              value={refundPolicy}
              onChange={(e) => setRefundPolicy(e.target.value)}
              placeholder="Full refunds up to 7 days before the event."
              aria-invalid={Boolean(error)}
            />
          </Field>
        </CardBody>

        <CardFooter className="justify-end">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" variant="solid" loading={saving}>
            {editing ? "Save changes" : "Create event"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
