"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { SelectField } from "@/components/ui/select";

/**
 * A select that filters a server-rendered page by writing one search param.
 *
 * Server components cannot hold an onChange handler, and the old native select
 * inside a bare `<form>` only submitted for people who found the noscript
 * button. This navigates on change and keeps the filter in the URL, so the view
 * survives a refresh and can be shared.
 */
export function QuerySelect({
  param,
  value,
  options,
  allLabel,
  label,
  className,
  size = "sm",
}: {
  param: string;
  value: string;
  options: { value: string; label: string }[];
  /** Adds a leading "no filter" option that clears the param. */
  allLabel?: string;
  label: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  // An option's value may not be empty, so "no filter" travels as a sentinel.
  const ALL = "__all";

  return (
    <SelectField
      aria-label={label}
      size={size}
      className={className}
      disabled={pending}
      value={value || ALL}
      onChange={(next) => {
        const query = new URLSearchParams(params);
        if (next === ALL) query.delete(param);
        else query.set(param, next);
        query.delete("page");
        const search = query.toString();
        startTransition(() => router.push(search ? `?${search}` : "?", { scroll: false }));
      }}
      options={allLabel ? [{ value: ALL, label: allLabel }, ...options] : options}
    />
  );
}
