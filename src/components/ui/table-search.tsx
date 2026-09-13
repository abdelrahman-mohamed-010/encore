"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * The debounced search box every list screen opens with. Seven copies each
 * positioned the same icon by hand.
 */
export function TableSearch({
  value,
  onChange,
  placeholder,
  label,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  /** Accessible name — the input has no visible label. */
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("relative min-w-56 max-w-sm flex-1", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="pl-9"
        aria-label={label}
      />
    </div>
  );
}
