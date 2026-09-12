import * as React from "react";
import { cn } from "@/lib/utils";

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
        "flex flex-col items-center justify-center gap-4 px-6 py-16 text-center",
        className,
      )}
    >
      {Icon && (
        <span className="grid size-12 place-items-center rounded-xl bg-sunken text-ink-3">
          <Icon className="size-5" />
        </span>
      )}
      <div className="space-y-1.5">
        <p className="text-md font-medium text-ink">{title}</p>
        {description && (
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-ink-3">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

