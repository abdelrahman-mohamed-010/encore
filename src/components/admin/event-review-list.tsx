"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, ExternalLink, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/surface";
import { Segmented } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/misc";
import { formatDate, formatNumber } from "@/lib/format";
import type { EventStatus } from "@/lib/types";

type ReviewEvent = {
  id: string;
  title: string;
  slug: string;
  status: EventStatus;
  subtitle: string | null;
  startsAt: string;
  coverImageUrl: string | null;
  organizerName: string;
  venueLabel: string;
  tiers: number;
  capacity: number;
};

const TONE: Record<EventStatus, "positive" | "caution" | "neutral" | "critical"> = {
  published: "positive",
  draft: "neutral",
  pending_review: "caution",
  paused: "caution",
  cancelled: "critical",
  completed: "neutral",
};

export function EventReviewList({ events }: { events: ReviewEvent[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState("pending_review");
  const [pending, startTransition] = useTransition();

  const visible = filter === "all" ? events : events.filter((e) => e.status === filter);

  function setStatus(event: ReviewEvent, status: EventStatus, reason?: string) {
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("events")
        .update({ status, rejection_reason: reason ?? null })
        .eq("id", event.id);

      if (error) {
        toast.error("Could not update the event", { description: error.message });
        return;
      }

      toast.success(
        status === "published" ? `${event.title} is live` : `${event.title} moved to ${status.replace("_", " ")}`,
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <Segmented
        value={filter}
        onChange={setFilter}
        options={[
          { value: "pending_review", label: "Pending" },
          { value: "published", label: "Published" },
          { value: "draft", label: "Drafts" },
          { value: "all", label: "All" },
        ]}
      />

      {visible.length === 0 ? (
        <EmptyState
          icon={Check}
          title="Nothing here"
          description={
            filter === "pending_review"
              ? "No events are waiting for approval."
              : "No events match this filter."
          }
        />
      ) : (
        <Card className="overflow-hidden">
          {visible.map((event) => (
            <div
              key={event.id}
              className="flex flex-wrap items-center gap-4 border-b border-hairline-soft px-4 py-4 last:border-b-0"
            >
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-sunken">
                {event.coverImageUrl && (
                  <Image src={event.coverImageUrl} alt="" fill sizes="56px" className="object-cover" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-base font-medium text-ink">{event.title}</p>
                  <Badge tone={TONE[event.status]} size="xs">
                    {event.status.replace("_", " ")}
                  </Badge>
                </div>
                <p className="mt-1 truncate text-xs text-ink-3">
                  {event.organizerName} · {formatDate(event.startsAt, "medium")}
                  {event.venueLabel && ` · ${event.venueLabel}`}
                </p>
                <p className="mt-0.5 text-xs text-ink-3">
                  {event.tiers} ticket {event.tiers === 1 ? "type" : "types"} ·{" "}
                  {formatNumber(event.capacity)} capacity
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/events/${event.slug}`} target="_blank">
                    Preview <ExternalLink />
                  </Link>
                </Button>

                {event.status === "pending_review" && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() => setStatus(event, "draft", "Returned by an administrator")}
                    >
                      <X /> Reject
                    </Button>
                    <Button
                      variant="solid"
                      size="sm"
                      disabled={pending || event.tiers === 0}
                      title={event.tiers === 0 ? "This event has no ticket types yet" : undefined}
                      onClick={() => setStatus(event, "published")}
                    >
                      <Check /> Approve
                    </Button>
                  </>
                )}

                {event.status === "published" && (
                  <Button variant="ghost" size="sm" disabled={pending} onClick={() => setStatus(event, "paused")}>
                    Pause
                  </Button>
                )}

                {event.status === "paused" && (
                  <Button variant="solid" size="sm" disabled={pending} onClick={() => setStatus(event, "published")}>
                    Resume
                  </Button>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
