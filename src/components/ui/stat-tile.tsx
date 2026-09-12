import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Dashboard metric. Every tile is the same height whether or not it has a
 * delta, so a row of them never looks ragged.
 */

export function StatTile({
  label,
  value,
  sub,
  delta,
  icon: Icon,
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  delta?: { value: number; suffix?: string } | null;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col justify-between rounded-xl bg-card p-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink-3">{label}</p>
        {Icon && (
          <span className="grid size-7 place-items-center rounded-md bg-sunken text-ink-3">
            <Icon className="size-3.5" />
          </span>
        )}
      </div>
      <p className="mt-3 font-display text-[1.625rem] font-semibold leading-none numeral text-ink">
        {value}
      </p>
      <div className="mt-2 flex min-h-[18px] items-center gap-2">
        {delta != null && (
          <span
            className={cn(
              "text-xs font-medium tabular",
              delta.value >= 0 ? "text-positive" : "text-critical",
            )}
          >
            {delta.value >= 0 ? "+" : ""}
            {delta.value}
            {delta.suffix ?? "%"}
          </span>
        )}
        {sub && <span className="truncate text-xs text-ink-3">{sub}</span>}
      </div>
    </div>
  );
}

/** Horizontal key/value line used in summaries and totals. */
export function SummaryLine({
  label,
  value,
  strong = false,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  strong?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 text-base", className)}>
      <span className={cn(strong ? "font-medium text-ink" : "text-ink-2")}>{label}</span>
      <span className={cn("tabular", strong ? "text-md font-semibold text-ink" : "text-ink")}>
        {value}
      </span>
    </div>
  );
}
