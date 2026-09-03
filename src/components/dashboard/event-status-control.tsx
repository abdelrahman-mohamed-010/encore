"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
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
  status,
}: {
  eventId: string;
  status: EventStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const options = TRANSITIONS[status] ?? [];

  if (options.length === 0) return null;

  function move(to: EventStatus) {
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("events").update({ status: to }).eq("id", eventId);

      if (error) {
        toast.error("Could not change the status", { description: error.message });
        return;
      }

      toast.success(`Event moved to ${to.replace("_", " ")}`);
      router.refresh();
    });
  }

  return (
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
            onSelect={() => move(option.to)}
            className={option.danger ? "text-critical focus:text-critical" : undefined}
          >
            {option.label}
          </DropdownItem>
        ))}
      </DropdownContent>
    </Dropdown>
  );
}
