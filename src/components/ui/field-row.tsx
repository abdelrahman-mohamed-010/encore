import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The icon-chip + label + value row that carries most of the detail screens.
 * Rows stack inside a Card and separate themselves with hairlines, so a list of
 * facts always lines up on the same left rail regardless of content length.
 */
export function FieldRow({
  icon: Icon,
  label,
  value,
  action,
  align = "center",
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: React.ReactNode;
  value?: React.ReactNode;
  action?: React.ReactNode;
  align?: "center" | "start";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex gap-3.5 px-4 py-3.5 first:rounded-t-xl last:rounded-b-xl",
        "border-b border-hairline-soft last:border-b-0",
        align === "center" ? "items-center" : "items-start",
        className,
      )}
    >
      {Icon && (
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-lg border border-hairline bg-sunken text-ink-2",
            align === "start" && "mt-0.5",
          )}
        >
          <Icon className="size-4" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] text-ink-3">{label}</p>
        {value !== undefined && (
          <div className="mt-0.5 text-[14px] font-medium leading-snug text-ink">{value}</div>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** A soft square icon chip, used in lists and empty states. */
export function IconChip({
  icon: Icon,
  tone = "neutral",
  size = "md",
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone?: "neutral" | "accent" | "positive" | "caution" | "critical" | "info";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const tones = {
    neutral: "border-hairline bg-sunken text-ink-2",
    accent: "border-transparent bg-accent-100 text-accent-700 dark:bg-accent-950 dark:text-accent-300",
    positive: "border-transparent bg-positive-bg text-positive",
    caution: "border-transparent bg-caution-bg text-caution",
    critical: "border-transparent bg-critical-bg text-critical",
    info: "border-transparent bg-info-bg text-info",
  } as const;
  const sizes = {
    sm: "size-7 rounded-md [&_svg]:size-3.5",
    md: "size-9 rounded-lg [&_svg]:size-4",
    lg: "size-11 rounded-xl [&_svg]:size-5",
  } as const;

  return (
    <span className={cn("grid shrink-0 place-items-center border", tones[tone], sizes[size], className)}>
      <Icon className="" />
    </span>
  );
}

/**
 * Month-over-day calendar block. Fixed width so a column of these stays
 * perfectly aligned whatever the date.
 */
export function DateBlock({
  date,
  timeZone,
  className,
}: {
  date: string | Date;
  timeZone?: string;
  className?: string;
}) {
  const value = typeof date === "string" ? new Date(date) : date;
  const month = new Intl.DateTimeFormat("en-US", { month: "short", timeZone })
    .format(value)
    .toUpperCase();
  const day = new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone }).format(value);

  return (
    <div
      className={cn(
        "grid size-12 shrink-0 place-content-center overflow-hidden rounded-lg border border-hairline bg-card text-center",
        className,
      )}
    >
      <span className="block bg-sunken px-2 pb-px pt-1 text-[9px] font-semibold leading-none tracking-[0.08em] text-ink-3">
        {month}
      </span>
      <span className="block px-2 pb-1 pt-1 text-[17px] font-semibold leading-none tabular text-ink">
        {day}
      </span>
    </div>
  );
}
