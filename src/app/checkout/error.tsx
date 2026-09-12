"use client";

import { SegmentError } from "@/components/layout/segment-error";

export default function Error(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <SegmentError
      {...props}
      title="Checkout hit a problem"
      description="Your tickets are still held. Try again, or return to the event."
    />
  );
}
