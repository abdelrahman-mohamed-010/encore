import * as React from "react";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("relative overflow-hidden rounded-lg bg-sunken", className)} {...props}>
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/[0.05] to-transparent dark:via-white/[0.06] [animation:sweep_1.6s_infinite]" />
    </div>
  );
}

export function Avatar({
  src,
  name,
  size = "md",
  className,
}: {
  src?: string | null;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizes = {
    xs: "size-6 text-[10px]",
    sm: "size-8 text-[11px]",
    md: "size-9 text-[12px]",
    lg: "size-11 text-[13px]",
    xl: "size-16 text-lg",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full",
        "border border-hairline bg-sunken font-semibold text-ink-2",
        sizes[size],
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}

export function Meter({
  value,
  max = 100,
  tone = "solid",
  className,
  label,
}: {
  value: number;
  max?: number;
  tone?: "solid" | "accent" | "positive" | "caution" | "critical";
  className?: string;
  label?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const tones = {
    solid: "bg-solid",
    accent: "bg-accent-500",
    positive: "bg-positive",
    caution: "bg-caution",
    critical: "bg-critical",
  } as const;

  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-sunken", className)}
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-700", tones[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-hairline px-6 py-16 text-center",
        className,
      )}
    >
      {Icon && (
        <span className="grid size-12 place-items-center rounded-xl border border-hairline bg-sunken text-ink-3">
          <Icon className="size-5" />
        </span>
      )}
      <div className="space-y-1.5">
        <p className="text-[15px] font-medium text-ink">{title}</p>
        {description && (
          <p className="mx-auto max-w-sm text-[13.5px] leading-relaxed text-ink-3">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

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
    <div className={cn("flex flex-col justify-between rounded-xl border border-hairline bg-card p-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] text-ink-3">{label}</p>
        {Icon && (
          <span className="grid size-7 place-items-center rounded-md bg-sunken text-ink-3">
            <Icon className="size-3.5" />
          </span>
        )}
      </div>
      <p className="mt-3 text-[26px] font-semibold leading-none tracking-[-0.02em] tabular text-ink">
        {value}
      </p>
      <div className="mt-2 flex min-h-[18px] items-center gap-2">
        {delta != null && (
          <span
            className={cn(
              "text-[12px] font-medium tabular",
              delta.value >= 0 ? "text-positive" : "text-critical",
            )}
          >
            {delta.value >= 0 ? "+" : ""}
            {delta.value}
            {delta.suffix ?? "%"}
          </span>
        )}
        {sub && <span className="truncate text-[12px] text-ink-3">{sub}</span>}
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
    <div className={cn("flex items-baseline justify-between gap-4 text-[14px]", className)}>
      <span className={cn(strong ? "font-medium text-ink" : "text-ink-2")}>{label}</span>
      <span className={cn("tabular", strong ? "text-[15px] font-semibold text-ink" : "text-ink")}>
        {value}
      </span>
    </div>
  );
}
