import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex select-none items-center gap-1.5 whitespace-nowrap border font-medium [&_svg]:size-3",
  {
    variants: {
      tone: {
        neutral:  "border-hairline bg-sunken text-ink-2",
        solid:    "border-transparent bg-solid text-on-solid",
        accent:   "border-transparent bg-accent-100 text-accent-700 dark:bg-accent-950 dark:text-accent-300",
        positive: "border-transparent bg-positive-bg text-positive",
        caution:  "border-transparent bg-caution-bg text-caution",
        critical: "border-transparent bg-critical-bg text-critical",
        info:     "border-transparent bg-info-bg text-info",
        outline:  "border-hairline bg-transparent text-ink-2",
      },
      size: {
        xs: "rounded-md px-1.5 py-0.5 text-2xs",
        sm: "rounded-md px-2 py-[3px] text-2xs",
        md: "rounded-lg px-2.5 py-1 text-xs",
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
    accent: "bg-accent-500",
  } as const;
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm text-ink-2", className)}>
      <span className={cn("size-1.5 shrink-0 rounded-full", dots[tone])} />
      {children}
    </span>
  );
}

export { badgeVariants };
