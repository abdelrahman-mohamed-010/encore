import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The header every dashboard page opens with.
 *
 * The periwinkle wash fades into the page rather than ending on a rule, which
 * is what keeps it reading as the top of this page instead of a second app
 * bar stacked under the real one.
 */
export function DashboardHeader({
  crumb,
  title,
  description,
  actions,
  tabs,
  className,
}: {
  crumb?: { label: string; href?: string };
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** Rendered on the rule that closes the header. */
  tabs?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("page-wash", className)}>
      <div className="px-5 pt-6 md:px-8">
        {crumb &&
          (crumb.href ? (
            <Link
              href={crumb.href}
              className="inline-flex items-center gap-1.5 text-base text-ink-2 transition-colors hover:text-ink"
            >
              {crumb.label}
              <ChevronRight className="size-3.5" />
            </Link>
          ) : (
            <p className="inline-flex items-center gap-1.5 text-base text-ink-2">
              {crumb.label}
              <ChevronRight className="size-3.5" />
            </p>
          ))}

        <div className="mt-2 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h1 className="display-3 text-ink">{title}</h1>
            {description && (
              <p className="mt-1.5 max-w-prose text-base leading-relaxed text-ink-2">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
        </div>
      </div>

      {/* The rule spans the pane even when the tabs do not fill it. */}
      <div className={cn("mt-6 border-b border-hairline", !tabs && "border-transparent")}>
        {tabs && <div className="px-5 md:px-8">{tabs}</div>}
      </div>
    </div>
  );
}

/** Standard padding for everything below a `DashboardHeader`. */
export function DashboardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-8 md:px-8", className)} {...props} />;
}
