"use client";

import Link from "next/link";
import { Check, ExternalLink, X } from "lucide-react";
import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import { setEventReviewStatus } from "@/features/admin/actions";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import type { EventStatus } from "@/lib/types";

export function EventReviewActions({
  id,
  title,
  slug,
  status,
  tiers,
}: {
  id: string;
  title: string;
  slug: string;
  status: EventStatus;
  tiers: number;
}) {
  const review = useAction(setEventReviewStatus, {
    onSuccess: ({ input }) =>
      toast.success(
        input.status === "published"
          ? `${title} is live`
          : input.status === "draft"
            ? `${title} returned to draft`
            : `${title} moved to ${input.status.replace("_", " ")}`,
      ),
    onError: ({ error }) =>
      toast.error("Could not update the event", { description: error.serverError }),
  });

  const pending = review.isPending;
  const setStatus = (status: EventStatus, reason?: string) =>
    review.execute({ id, status, reason });

  return (
    <div className="flex items-center justify-end gap-1.5">
      {status === "pending_review" && (
        <>
          <Button
            variant="ghost"
            size="xs"
            disabled={pending}
            onClick={() => setStatus("draft", "Returned by an administrator")}
          >
            <X className="size-3.5" /> Reject
          </Button>
          {tiers === 0 ? (
            <Tooltip content="This event has no ticket types yet">
              <span tabIndex={0} className="inline-flex">
                <Button variant="solid" size="xs" disabled>
                  <Check className="size-3.5" /> Approve
                </Button>
              </span>
            </Tooltip>
          ) : (
            <Button variant="solid" size="xs" disabled={pending} onClick={() => setStatus("published")}>
              <Check className="size-3.5" /> Approve
            </Button>
          )}
        </>
      )}

      {status === "published" && (
        <Button variant="ghost" size="xs" disabled={pending} onClick={() => setStatus("paused")}>
          Pause
        </Button>
      )}

      {status === "paused" && (
        <Button variant="solid" size="xs" disabled={pending} onClick={() => setStatus("published")}>
          Resume
        </Button>
      )}

      <Button asChild variant="ghost" size="xs">
        <Link href={`/events/${slug}`} target="_blank">
          <ExternalLink className="size-3.5" />
        </Link>
      </Button>
    </div>
  );
}
