"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <Logo />
      <p className="eyebrow mt-10">Something went wrong</p>
      <h1 className="display-2 mt-3 text-ink">That did not work</h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-2">
        The page hit an unexpected error. Trying again often clears it.
      </p>
      {error.digest && (
        <p className="mt-3 font-mono text-[12px] text-ink-3">Reference: {error.digest}</p>
      )}
      <Button variant="solid" size="lg" className="mt-8" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
