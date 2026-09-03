"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Category } from "@/lib/types";

const SORTS = [
  { value: "soonest", label: "Soonest" },
  { value: "newest", label: "Recently added" },
  { value: "price_low", label: "Price: low to high" },
  { value: "price_high", label: "Price: high to low" },
  { value: "popular", label: "Most viewed" },
];

const WHEN = [
  { value: "", label: "Any date" },
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
        <span className="mr-1 hidden items-center gap-2 text-[13px] font-medium text-ink-2 sm:flex">
          <SlidersHorizontal className="size-3.5" />
          Filter
        </span>

        <Select
          aria-label="Category"
          className="h-9 w-auto min-w-36 text-[13px]"
          value={params.get("category") ?? ""}
          onChange={(e) => setParam("category", e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </Select>

        <Select
          aria-label="City"
          className="h-9 w-auto min-w-32 text-[13px]"
          value={params.get("city") ?? ""}
          onChange={(e) => setParam("city", e.target.value)}
        >
          <option value="">Anywhere</option>
          {cities.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </Select>

        <Select
          aria-label="When"
          className="h-9 w-auto min-w-32 text-[13px]"
          value={params.get("when") ?? ""}
          onChange={(e) => setParam("when", e.target.value)}
        >
          {WHEN.map((w) => (
            <option key={w.value} value={w.value}>{w.label}</option>
          ))}
        </Select>

        <Button
          type="button"
          variant={params.get("free") ? "solid" : "outline"}
          size="sm"
          onClick={() => setParam("free", params.get("free") ? "" : "1")}
        >
          Free
        </Button>

        <div className="ml-auto flex items-center gap-2.5">
          <span className="hidden text-[13px] text-ink-3 sm:inline tabular">
            {total} {total === 1 ? "event" : "events"}
          </span>
          <Select
            aria-label="Sort by"
            className="h-9 w-auto min-w-40 text-[13px]"
            value={params.get("sort") ?? "soonest"}
            onChange={(e) => setParam("sort", e.target.value === "soonest" ? "" : e.target.value)}
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
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
              <Badge tone="neutral" size="md" pill className="gap-1.5 pr-1.5 transition-colors group-hover:bg-n-150 dark:group-hover:bg-n-800">
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
