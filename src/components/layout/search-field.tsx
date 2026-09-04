"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchField({
  className,
  placeholder = "Search events, venues, organizers",
  size = "md",
  autoFocus,
}: {
  className?: string;
  placeholder?: string;
  size?: "md" | "lg";
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("q") ?? "";

  return (
    <form
      role="search"
      className={cn("relative", className)}
      onSubmit={(event) => {
        event.preventDefault();
        const value = new FormData(event.currentTarget).get("q");
        const next = new URLSearchParams(params.toString());
        const trimmed = typeof value === "string" ? value.trim() : "";

        if (trimmed) next.set("q", trimmed);
        else next.delete("q");
        next.delete("page");

        router.push(`/events${next.size ? `?${next}` : ""}`);
      }}
    >
      <Search
        className={cn(
          "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3",
          size === "lg" ? "size-[18px]" : "size-4",
        )}
      />
      {/*
        Uncontrolled, keyed by the URL: when the query changes from elsewhere
        (a filter chip, the back button) the input remounts with the new value,
        so there is no state to sync inside an effect.
      */}
      <input
        key={current}
        type="search"
        name="q"
        defaultValue={current}
        autoFocus={autoFocus}
        placeholder={placeholder}
        aria-label="Search events"
        className={cn(
          "w-full rounded-lg border border-hairline bg-card text-ink placeholder:text-ink-3",
          "transition-colors hover:border-n-300 dark:hover:border-n-700",
          "focus-visible:border-accent-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-500/18",
          "[&::-webkit-search-cancel-button]:appearance-none",
          size === "lg" ? "h-12 pl-11 pr-4 text-md" : "h-9 pl-9 pr-3.5 text-sm",
        )}
      />
    </form>
  );
}
