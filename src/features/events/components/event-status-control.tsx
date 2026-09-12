"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import { setEventStatus } from "@/features/events/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownTrigger,
} from "@/components/ui/dropdown";
import type { EventStatus } from "@/lib/types";

/**
 * Organizers move an event between draft, review, paused and cancelled. Only an
 * admin may flip it to `published` — the database enforces that — so a rejected
 * transition is surfaced rather than silently swallowed.
 */
const TRANSITIONS: Partial<Record<EventStatus, { to: EventStatus; label: string; danger?: boolean }[]>> = {
  draft: [{ to: "pending_review", label: "Submit for review" }],
  pending_review: [{ to: "draft", label: "Back to draft" }],
  published: [
    { to: "paused", label: "Pause sales" },
    { to: "cancelled", label: "Cancel event", danger: true },
  ],
  paused: [
    { to: "published", label: "Resume sales" },
    { to: "cancelled", label: "Cancel event", danger: true },
  ],
  cancelled: [{ to: "draft", label: "Reopen as draft" }],
};

export function EventStatusControl({
  eventId,
  organizerSlug,
  status,
}: {
  eventId: string;
  organizerSlug: string;
  status: EventStatus;
}) {
  const [confirming, setConfirming] = useState<{ to: EventStatus; label: string } | null>(null);
  const options = TRANSITIONS[status] ?? [];

  const change = useAction(setEventStatus, {
    onSuccess: ({ input }) =>
      toast.success(`Event moved to ${input.status.replace("_", " ")}`),
    onError: ({ error }) =>
      toast.error("Could not change the status", { description: error.serverError }),
  });

  const pending = change.isPending;

  if (options.length === 0) return null;

  const move = (to: EventStatus) => change.executeAsync({ eventId, organizerSlug, status: to });

  return (
    <>
      <Dropdown>
        <DropdownTrigger asChild>
          <Button variant="solid" size="sm" loading={pending}>
            Change status
            <ChevronDown />
          </Button>
        </DropdownTrigger>

        <DropdownContent>
          <DropdownLabel>Move to</DropdownLabel>
          {options.map((option) => (
            <DropdownItem
              key={option.to}
              onSelect={() =>
                option.danger ? setConfirming(option) : move(option.to)
              }
              className={option.danger ? "text-critical focus:text-critical" : undefined}
            >
              {option.label}
            </DropdownItem>
          ))}
        </DropdownContent>
      </Dropdown>

      <ConfirmDialog
        open={confirming !== null}
        onOpenChange={(next) => !next && setConfirming(null)}
        title={confirming?.label ?? ""}
        description="Sales stop immediately and the event is marked cancelled. This doesn't refund existing orders — do that separately if needed."
        confirmLabel="Cancel event"
        onConfirm={async () => {
          if (confirming) await move(confirming.to);
        }}
      />
    </>
  );
}
