"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const FORMAT = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });

/**
 * The viewer's local time, mirroring the reference nav.
 *
 * Renders empty on the server and on the first client paint: the value depends
 * on the visitor's clock and locale, so emitting it during SSR would guarantee
 * a hydration mismatch. The reserved width keeps the nav from shifting when the
 * time appears.
 */
export function NavClock({ className }: { className?: string }) {
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setNow(FORMAT.format(new Date()));
    tick();
    // Half a minute keeps the displayed minute at most ~30s stale without
    // needing to align to the wall-clock boundary.
    const interval = setInterval(tick, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className={cn("min-w-[4.5ch] text-md tnum text-ink-2", className)}>{now}</span>
  );
}
