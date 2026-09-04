import * as React from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * An inline message attached to the thing it is about — a missing venue, an
 * expiring hold, a payout that needs setup. Distinct from a toast, which is
 * transient and belongs to an action rather than to a place on the page.
 */

const TONES = {
  info: { wrap: "bg-info-bg/60 text-ink", icon: "text-info", Icon: Info },
  positive: { wrap: "bg-positive-bg/60 text-ink", icon: "text-positive", Icon: CheckCircle2 },
  caution: { wrap: "bg-caution-bg/60 text-ink", icon: "text-caution", Icon: AlertTriangle },
  critical: { wrap: "bg-critical-bg/60 text-ink", icon: "text-critical", Icon: XCircle },
} as const;

export function Callout({
  tone = "info",
  title,
  icon,
  action,
  children,
  className,
}: {
  tone?: keyof typeof TONES;
  title?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  const { wrap, icon: iconTone, Icon } = TONES[tone];

  return (
    <div
      role={tone === "critical" ? "alert" : "status"}
      className={cn("flex items-start gap-3 rounded-xl px-4 py-3.5", wrap, className)}
    >
      <span className={cn("mt-px shrink-0 [&_svg]:size-[18px]", iconTone)} aria-hidden>
        {icon ?? <Icon />}
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        {title && <p className={cn("text-base font-semibold", iconTone)}>{title}</p>}
        {children && <div className="text-sm leading-relaxed text-ink-2">{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** Full-bleed strip for page- or account-level state (banned, unverified). */
export function Banner({
  tone = "caution",
  children,
  action,
  className,
}: {
  tone?: keyof typeof TONES;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  const { wrap, icon: iconTone, Icon } = TONES[tone];
  return (
    <div className={cn("border-b border-hairline-soft", wrap, className)}>
      <div className="container-page flex items-center gap-3 py-2.5">
        <Icon className={cn("size-4 shrink-0", iconTone)} aria-hidden />
        <p className="min-w-0 flex-1 text-sm text-ink-2">{children}</p>
        {action}
      </div>
    </div>
  );
}
