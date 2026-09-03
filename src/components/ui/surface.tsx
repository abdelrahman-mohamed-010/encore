import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The one raised surface in the product. Hairline border, no shadow by default —
 * elevation is reserved for things that genuinely float (menus, dialogs).
 */
export function Card({
  className,
  inset = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-hairline",
        inset ? "bg-sunken" : "bg-card",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  bordered = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { bordered?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 px-5 py-4",
        bordered && "border-b border-hairline-soft",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-[15px] font-semibold text-ink", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-0.5 text-[13px] leading-relaxed text-ink-3", className)} {...props} />;
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center gap-3 border-t border-hairline-soft px-5 py-3.5", className)}
      {...props}
    />
  );
}

/** A page-level section heading with an optional trailing action. */
export function SectionHeader({
  title,
  description,
  action,
  eyebrow,
  level = 2,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  eyebrow?: string;
  /** Use 1 when this heading is the page's title, so every page has one h1. */
  level?: 1 | 2 | 3;
  className?: string;
}) {
  const Heading = `h${level}` as "h1" | "h2" | "h3";

  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-x-6 gap-y-3", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <Heading className="display-3 text-ink">{title}</Heading>
        {description && (
          <p className="mt-1.5 max-w-prose text-[14px] leading-relaxed text-ink-2">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Divider({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div role="separator" className={cn("h-px w-full bg-hairline-soft", className)} {...props} />;
}
