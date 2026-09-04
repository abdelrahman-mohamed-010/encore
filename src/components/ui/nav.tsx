import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Page navigation: pagination, breadcrumbs, step indicators, keyboard hints. */

export function Pagination({
  page,
  pageCount,
  hrefFor,
  className,
}: {
  page: number;
  pageCount: number;
  /** Server-rendered pagination: each control is a real link, so it works
      without JS and the current page survives a refresh or a shared URL. */
  hrefFor: (page: number) => string;
  className?: string;
}) {
  if (pageCount <= 1) return null;

  // Always show first, last, current and its neighbours; elide the rest.
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === pageCount || Math.abs(n - page) <= 1,
  );

  return (
    <nav className={cn("flex items-center justify-center gap-1", className)} aria-label="Pagination">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Previous page"
        disabled={page <= 1}
        asChild={page > 1}
      >
        {page > 1 ? (
          <Link href={hrefFor(page - 1)}>
            <ChevronLeft />
          </Link>
        ) : (
          <ChevronLeft />
        )}
      </Button>

      {pages.map((n, index) => (
        <React.Fragment key={n}>
          {index > 0 && n - pages[index - 1] > 1 && (
            <span className="px-1 text-sm text-ink-3" aria-hidden>
              …
            </span>
          )}
          <Button
            variant={n === page ? "solid" : "ghost"}
            size="icon-sm"
            aria-label={`Page ${n}`}
            aria-current={n === page ? "page" : undefined}
            asChild
          >
            <Link href={hrefFor(n)} className="tnum">
              {n}
            </Link>
          </Button>
        </React.Fragment>
      ))}

      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Next page"
        disabled={page >= pageCount}
        asChild={page < pageCount}
      >
        {page < pageCount ? (
          <Link href={hrefFor(page + 1)}>
            <ChevronRight />
          </Link>
        ) : (
          <ChevronRight />
        )}
      </Button>
    </nav>
  );
}

export function Breadcrumbs({
  items,
  className,
}: {
  items: { label: string; href?: string }[];
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1.5 text-sm", className)}>
      {items.map((item, index) => (
        <React.Fragment key={item.label}>
          {index > 0 && <ChevronRight className="size-3.5 shrink-0 text-ink-3" aria-hidden />}
          {item.href ? (
            <Link
              href={item.href}
              className="truncate text-ink-3 transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ) : (
            <span className="truncate font-medium text-ink" aria-current="page">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

export function Steps({
  steps,
  current,
  className,
}: {
  steps: string[];
  /** Zero-based index of the active step. */
  current: number;
  className?: string;
}) {
  return (
    <ol className={cn("flex items-center gap-2", className)}>
      {steps.map((step, index) => {
        const state = index < current ? "done" : index === current ? "active" : "todo";
        return (
          <li key={step} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full text-2xs font-semibold tnum",
                state === "done" && "bg-brand-600 text-white",
                state === "active" && "bg-brand-600 text-white ring-4 ring-brand-500/20",
                state === "todo" && "bg-sunken text-ink-3",
              )}
              aria-hidden
            >
              {index + 1}
            </span>
            <span
              className={cn(
                "truncate text-sm",
                state === "todo" ? "text-ink-3" : "font-medium text-ink",
              )}
              aria-current={state === "active" ? "step" : undefined}
            >
              {step}
            </span>
            {index < steps.length - 1 && (
              <span
                className={cn(
                  "hidden h-px flex-1 sm:block",
                  index < current ? "bg-brand-500" : "bg-hairline",
                )}
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-hairline",
        "bg-sunken px-1.5 font-mono text-2xs font-medium text-ink-2",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
