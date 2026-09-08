import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Pills.
 *
 * A pale wash of a hue with its saturated foreground — never a solid fill,
 * never an outline. That gives status colour enough presence to scan without
 * competing with the near-black text around it. Corners are rounded but not
 * fully round: a capsule reads as a token, a rounded rectangle reads as a
 * label, and most of these are labels.
 */
const badgeVariants = cva(
  "inline-flex select-none items-center gap-1.5 whitespace-nowrap font-medium [&_svg]:size-3.5",
  {
    variants: {
      tone: {
        neutral:  "bg-btn text-ink-2",
        solid:    "bg-solid text-on-solid",
        accent:   "bg-brand-100 text-brand-700 dark:text-brand-200",
        positive: "bg-positive-bg text-positive",
        caution:  "bg-caution-bg text-caution",
        critical: "bg-critical-bg text-critical",
        info:     "bg-info-bg text-info",
        brand:    "bg-brand text-white",
        outline:  "bg-transparent text-ink shadow-[inset_0_0_0_1px_var(--color-line-2)]",
      },
      size: {
        xs: "h-5.5 rounded-[6px] px-2 text-2xs tracking-normal",
        sm: "h-6.5 rounded-lg px-2.5 text-sm",
        md: "h-8 rounded-[10px] px-3.5 text-base",
      },
      pill: { true: "rounded-full", false: "" },
    },
    defaultVariants: { tone: "neutral", size: "sm", pill: false },
  },
);

export function Badge({
  className,
  tone,
  size,
  pill,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone, size, pill, className }))} {...props} />;
}

/** A small coloured dot + label, for statuses inside dense tables. */
export function StatusDot({
  tone = "neutral",
  children,
  className,
}: {
  tone?: "neutral" | "positive" | "caution" | "critical" | "info" | "accent";
  children: React.ReactNode;
  className?: string;
}) {
  const dots = {
    neutral: "bg-n-400",
    positive: "bg-positive",
    caution: "bg-caution",
    critical: "bg-critical",
    info: "bg-info",
    accent: "bg-brand-500",
  } as const;

  return (
    <span className={cn("inline-flex items-center gap-2 text-sm text-ink-2", className)}>
      <span className={cn("size-1.5 shrink-0 rounded-full", dots[tone])} />
      {children}
    </span>
  );
}

/** A count sitting on a nav item or an avatar. */
export function Count({
  children,
  tone = "brand",
  className,
}: {
  children: React.ReactNode;
  tone?: "brand" | "gray";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-2xs font-semibold tracking-normal",
        tone === "brand" ? "bg-pink text-white" : "bg-ink-2 text-card",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** A removable chip, for tag inputs and active filters. */
export function Tag({
  children,
  onRemove,
  className,
}: {
  children: React.ReactNode;
  onRemove?: () => void;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-lg bg-sunken pl-2.5 text-sm font-medium text-ink",
        onRemove ? "pr-1.5" : "pr-2.5",
        className,
      )}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove"
          className="grid size-[18px] cursor-pointer place-items-center rounded-[5px] text-ink-2 transition-colors hover:bg-btn-h hover:text-ink"
        >
          <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}

export { badgeVariants };
