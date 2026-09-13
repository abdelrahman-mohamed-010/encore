"use client";

import { SegmentError } from "@/components/layout/segment-error";

export default function Error(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <SegmentError
      {...props}
      title="This page failed to load"
      description="Your orders and tickets are safe. Trying again usually clears it."
    />
  );
}
