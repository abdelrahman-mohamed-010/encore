"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { EventForm } from "@/components/dashboard/event-form";
import type { EventRow } from "@/lib/types";

type Option = { id: string; name: string; city?: string | null };

/**
 * Creating and editing an event both happen in the same right-side drawer —
 * categories/venues are fetched lazily on first open rather than threaded
 * down as props, so this can sit behind any trigger anywhere in the
 * dashboard without every page having to load form options up front.
 */
export function EventFormDrawer({
  organizerId,
  organizerSlug,
  event,
  trigger,
}: {
  organizerId: string;
  organizerSlug: string;
  /** Present only when editing; omit to create a new event. */
  event?: EventRow;
  trigger: React.ReactNode;
}) {
  const editing = Boolean(event);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ categories: Option[]; venues: Option[] } | null>(null);

  async function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && !data) {
      setLoading(true);
      const supabase = createClient();
      const [{ data: categories }, { data: venues }] = await Promise.all([
        supabase.from("categories").select("id, name").eq("is_active", true).order("sort_order"),
        supabase
          .from("venues")
          .select("id, name, city, seating_type")
          .or(`organizer_id.eq.${organizerId},organizer_id.is.null`)
          .eq("is_active", true)
          .order("name"),
      ]);
      setData({ categories: categories ?? [], venues: venues ?? [] });
      setLoading(false);
    }
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent size="lg">
        <DrawerHeader>
          <DrawerTitle>{editing ? "Edit event" : "Create an event"}</DrawerTitle>
          <DrawerDescription>
            {editing
              ? "Update the essentials — changes save immediately."
              : "Start with the essentials. You can add ticket types and artwork next."}
          </DrawerDescription>
        </DrawerHeader>

        {loading || !data ? (
          <div className="grid flex-1 place-items-center text-sm text-ink-3">Loading…</div>
        ) : (
          <EventForm
            organizerId={organizerId}
            organizerSlug={organizerSlug}
            categories={data.categories}
            venues={data.venues}
            event={event}
            layout="drawer"
            onCancel={() => setOpen(false)}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
}
