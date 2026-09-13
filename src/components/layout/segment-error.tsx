"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/surface";

export function SegmentError({
  error,
  reset,
  title,
  description,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title: string;
  description: string;
}) {
  useEffect(() => {
    console.error(`${title}:`, error);
  }, [error, title]);

  return (
    <div className="container-page py-10">
      <Card>
        <CardBody className="flex flex-col items-start gap-4 py-10 text-left sm:items-center sm:text-center">
          <span className="grid size-11 place-items-center rounded-xl bg-critical-bg text-critical">
            <AlertTriangle className="size-5" />
          </span>
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold text-ink">{title}</h2>
            <p className="max-w-md text-sm leading-relaxed text-ink-2">{description}</p>
            {error.digest && (
              <p className="font-mono text-xs text-ink-3">Reference: {error.digest}</p>
            )}
          </div>
          <Button variant="solid" size="md" onClick={reset}>
            Try again
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
