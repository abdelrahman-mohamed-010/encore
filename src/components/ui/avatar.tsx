import * as React from "react";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

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
    xs: "size-6 text-2xs",
    sm: "size-8 text-2xs",
    md: "size-9 text-xs",
    lg: "size-11 text-sm",
    xl: "size-16 text-lg",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full",
        "bg-sunken font-semibold text-ink-2",
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
