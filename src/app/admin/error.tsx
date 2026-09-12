"use client";

import { SegmentError } from "@/components/layout/segment-error";

export default function Error(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <SegmentError
      {...props}
      title="This admin page failed to load"
      description="Nothing was changed. Trying again usually clears it."
    />
  );
}
