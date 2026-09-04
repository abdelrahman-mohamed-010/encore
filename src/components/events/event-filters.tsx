"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Category } from "@/lib/types";

/**
 * A listbox option can never carry an empty value — an empty string is how the
 * control says "nothing is selected". So "no filter" travels as this sentinel
 * and is mapped back to an absent query param on the way out.
 */
const ANY = "__any";

const SORTS = [
  { value: "soonest", label: "Soonest" },
  { value: "newest", label: "Recently added" },
  { value: "price_low", label: "Price: low to high" },
  { value: "price_high", label: "Price: high to low" },
  { value: "popular", label: "Most viewed" },
];

const WHEN = [
  { value: ANY, label: "Any date" },
  { value: "today", label: "Today" },
  { value: "weekend", label: "This weekend" },
  { value: "week", label: "Next 7 days" },
  { value: "month", label: "Next 30 days" },
];

export function EventFilters({
  categories,
  cities,
  total,
}: {
  categories: Category[];
  cities: string[];
  total: number;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      next.delete("page");
      router.push(`/events${next.size ? `?${next}` : ""}`, { scroll: false });
    },
    [params, router],
  );

  const active = [
    params.get("q") && { key: "q", label: `“${params.get("q")}”` },
    params.get("category") && {
      key: "category",
      label: categories.find((c) => c.slug === params.get("category"))?.name ?? params.get("category")!,
    },
    params.get("city") && { key: "city", label: params.get("city")! },
    params.get("when") && {
      key: "when",
      label: WHEN.find((w) => w.value === params.get("when"))?.label ?? params.get("when")!,
    },
    params.get("free") && { key: "free", label: "Free only" },
    params.get("featured") && { key: "featured", label: "Featured" },
  ].filter(Boolean) as { key: string; label: string }[];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="mr-1 hidden items-center gap-2 text-sm font-medium text-ink-2 sm:flex">
          <SlidersHorizontal className="size-3.5" />
          Filter
        </span>

        <SelectField
          aria-label="Category"
          size="sm"
          className="w-auto min-w-36"
          value={params.get("category") || ANY}
          onChange={(value) => setParam("category", value === ANY ? "" : value)}
          options={[
            { value: ANY, label: "All categories" },
            ...categories.map((c) => ({ value: c.slug, label: c.name })),
          ]}
        />

        <SelectField
          aria-label="City"
          size="sm"
          className="w-auto min-w-32"
          value={params.get("city") || ANY}
          onChange={(value) => setParam("city", value === ANY ? "" : value)}
          options={[
            { value: ANY, label: "Anywhere" },
            ...cities.map((city) => ({ value: city, label: city })),
          ]}
        />

        <SelectField
          aria-label="When"
          size="sm"
          className="w-auto min-w-32"
          value={params.get("when") || ANY}
          onChange={(value) => setParam("when", value === ANY ? "" : value)}
          options={WHEN}
        />

        <Button
          type="button"
          variant={params.get("free") ? "solid" : "outline"}
          size="sm"
          onClick={() => setParam("free", params.get("free") ? "" : "1")}
        >
          Free
        </Button>

        <div className="ml-auto flex items-center gap-2.5">
          <span className="hidden text-sm text-ink-3 sm:inline tnum">
            {total} {total === 1 ? "event" : "events"}
          </span>
          <SelectField
            aria-label="Sort by"
            size="sm"
            className="w-auto min-w-40"
            value={params.get("sort") || "soonest"}
            onChange={(value) => setParam("sort", value === "soonest" ? "" : value)}
            options={SORTS}
          />
        </div>
      </div>

      {active.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {active.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => setParam(chip.key, "")}
              className="group"
              aria-label={`Remove filter ${chip.label}`}
            >
              <Badge tone="neutral" size="md" className="gap-1.5 pr-1.5 transition-colors group-hover:bg-n-150 dark:group-hover:bg-n-800">
                {chip.label}
                <X className="size-3 text-ink-3" />
              </Badge>
            </button>
          ))}
          <Button variant="link" size="sm" onClick={() => router.push("/events")}>
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
