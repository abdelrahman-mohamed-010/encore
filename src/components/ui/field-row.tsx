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
            "grid size-9 shrink-0 place-items-center rounded-lg bg-sunken text-ink-2",
            align === "start" && "mt-0.5",
          )}
        >
          <Icon className="size-4" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-ink-3">{label}</p>
        {value !== undefined && (
          <div className="mt-0.5 text-base font-medium leading-snug text-ink">{value}</div>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/**
 * Tones for the icon tile. The six named hues are decorative, not semantic —
 * use them to tell one shortcut or category apart from another. The status
 * tones (positive/caution/critical) do carry meaning, so never pick those
 * just because the colour looks right.
 */
export const CHIP_TONES = {
  neutral: "border-transparent bg-sunken text-ink-2",
  accent: "border-transparent bg-tint-purple text-tint-purple-fg",
  positive: "border-transparent bg-positive-bg text-positive",
  caution: "border-transparent bg-caution-bg text-caution",
  critical: "border-transparent bg-critical-bg text-critical",
  info: "border-transparent bg-info-bg text-info",
  violet: "border-transparent bg-tint-violet text-tint-violet-fg",
  blue: "border-transparent bg-tint-blue text-tint-blue-fg",
  cyan: "border-transparent bg-tint-cyan text-tint-cyan-fg",
  emerald: "border-transparent bg-tint-emerald text-tint-emerald-fg",
  amber: "border-transparent bg-tint-amber text-tint-amber-fg",
  pink: "border-transparent bg-tint-pink text-tint-pink-fg",
} as const;

/** A soft square icon chip, used in lists, shortcuts and empty states. */
export function IconChip({
  icon: Icon,
  tone = "neutral",
  size = "md",
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone?: keyof typeof CHIP_TONES;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizes = {
    sm: "size-7 rounded-lg [&_svg]:size-3.5",
    md: "size-9 rounded-xl [&_svg]:size-4",
    lg: "size-11 rounded-xl [&_svg]:size-5",
    xl: "size-12 rounded-2xl [&_svg]:size-[22px]",
  } as const;

  return (
    <span
      className={cn("grid shrink-0 place-items-center border", CHIP_TONES[tone], sizes[size], className)}
    >
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
        "grid size-12 shrink-0 place-content-center rounded-lg bg-sunken px-1 text-center",
        className,
      )}
    >
      <span className="block text-2xs font-semibold leading-none tracking-[0.08em] text-ink-3">
        {month}
      </span>
      <span className="mt-1 block text-xl font-semibold leading-none tabular text-ink">{day}</span>
    </div>
  );
}
