"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * A select you can type into. Use this instead of `Select` once a list runs
 * past ~12 options (venues, timezones, events, categories) — scrolling a long
 * menu is far worse than filtering a short one.
 */

export type ComboboxOption = {
  value: string;
  label: string;
  /** Right-aligned secondary text, e.g. a GMT offset or a ticket count. */
  hint?: string;
  /** Extra text matched while searching but not displayed. */
  keywords?: string;
  disabled?: boolean;
};

export function Combobox({
  value,
  onChange,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyMessage = "No matches.",
  groups,
  clearable,
  disabled,
  id,
  label,
  className,
  contentClassName,
  "aria-invalid": ariaInvalid,
  "aria-describedby": describedBy,
}: {
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  /** Optional heading per option, in declaration order. */
  groups?: { heading: string; values: string[] }[];
  clearable?: boolean;
  disabled?: boolean;
  id?: string;
  /** Accessible name. Needed whenever no visible <label> points at this. */
  label?: string;
  className?: string;
  contentClassName?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const listId = React.useId();
  const selected = options.find((option) => option.value === value);

  function choose(next: string) {
    onChange(clearable && next === value ? "" : next);
    setOpen(false);
  }

  const renderOption = (option: ComboboxOption) => (
    <CommandPrimitive.Item
      key={option.value}
      value={`${option.label} ${option.hint ?? ""} ${option.keywords ?? ""}`}
      disabled={option.disabled}
      onSelect={() => choose(option.value)}
      className="pop-item"
    >
      <Check
        className={cn(
          "size-4 shrink-0 text-brand-600",
          option.value === value ? "opacity-100" : "opacity-0",
        )}
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate">{option.label}</span>
      {option.hint && (
        <span className="shrink-0 font-mono text-xs text-ink-3">{option.hint}</span>
      )}
    </CommandPrimitive.Item>
  );

  const grouped = groups?.length
    ? groups.map((group) => ({
        heading: group.heading,
        items: group.values
          .map((v) => options.find((o) => o.value === v))
          .filter((o): o is ComboboxOption => Boolean(o)),
      }))
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          role="combobox"
          aria-label={label}
          aria-expanded={open}
          aria-haspopup="listbox"
          // Only reference the list while it exists in the DOM.
          aria-controls={open ? listId : undefined}
          aria-invalid={ariaInvalid}
          aria-describedby={describedBy}
          disabled={disabled}
          className={cn(
            "flex h-(--size-field) w-full items-center justify-between gap-2 rounded-xl border border-hairline bg-card px-3 text-base text-ink",
            "transition-[border-color,box-shadow] duration-150 hover:border-n-300 dark:hover:border-n-700",
            "focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-500/20",
            "data-[state=open]:border-brand-500 data-[state=open]:ring-[3px] data-[state=open]:ring-brand-500/20",
            "aria-[invalid=true]:border-critical aria-[invalid=true]:ring-critical/20",
            "disabled:cursor-not-allowed disabled:bg-sunken disabled:opacity-60",
            className,
          )}
        >
          <span className={cn("min-w-0 truncate text-left", !selected && "text-ink-3")}>
            {selected?.label ?? placeholder}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-ink-3" aria-hidden />
        </button>
      </PopoverTrigger>

      <PopoverContent
        padded={false}
        className={cn("w-(--radix-popover-trigger-width) min-w-56", contentClassName)}
      >
        <CommandPrimitive loop>
          <div className="flex items-center gap-2 border-b border-hairline-soft px-3">
            <Search className="size-4 shrink-0 text-ink-3" aria-hidden />
            <CommandPrimitive.Input
              placeholder={searchPlaceholder}
              className="h-11 w-full bg-transparent text-base text-ink placeholder:text-ink-3 focus:outline-none"
            />
          </div>
          <CommandPrimitive.List
            id={listId}
            className="max-h-64 overflow-y-auto overscroll-contain p-1.5"
          >
            <CommandPrimitive.Empty className="px-3 py-6 text-center text-sm text-ink-3">
              {emptyMessage}
            </CommandPrimitive.Empty>
            {grouped
              ? grouped.map((group) => (
                  <CommandPrimitive.Group
                    key={group.heading}
                    heading={group.heading}
                    className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-ink-3"
                  >
                    {group.items.map(renderOption)}
                  </CommandPrimitive.Group>
                ))
              : options.map(renderOption)}
          </CommandPrimitive.List>
        </CommandPrimitive>
      </PopoverContent>
    </Popover>
  );
}
