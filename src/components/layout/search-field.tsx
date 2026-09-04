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
  size?: "sm" | "md" | "lg";
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
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-3",
          size === "lg" ? "left-4 size-[18px]" : "left-3 size-4",
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
          "w-full rounded-md border-0 bg-sunken text-ink placeholder:text-ink-3",
          "transition-[background-color,box-shadow] duration-150 hover:bg-sunken-2",
          "focus:bg-card focus:outline-none focus:shadow-[0_0_0_2px_var(--color-focus)]",
          "[&::-webkit-search-cancel-button]:appearance-none",
          size === "lg" && "h-(--size-field-lg) pl-11 pr-4 text-lg",
          size === "md" && "h-(--size-field) pl-10 pr-3.5 text-md",
          size === "sm" && "h-(--size-field-sm) pl-9 pr-3 text-base",
        )}
      />
    </form>
  );
}
