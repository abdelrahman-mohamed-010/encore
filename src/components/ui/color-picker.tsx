"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Replaces `<input type="color">`, whose swatch button and OS colour dialog are
 * completely unstyleable and wildly different per platform.
 *
 * A curated palette is also the better product decision here: these colours are
 * category accents shown across the site, so they need to stay legible on both
 * surfaces. Free choice reliably produces #FFFF00 on white.
 */

export const CATEGORY_SWATCHES = [
  "#7c5cff", "#4f7df6", "#2a9dd6", "#12a594", "#3fa34d", "#8aab2e",
  "#d69a1e", "#e07b39", "#dc5b5b", "#d64f8f", "#a95ad6", "#6b7280",
];

export function ColorPicker({
  value,
  onChange,
  onBlur,
  id,
  disabled,
  swatches = CATEGORY_SWATCHES,
  className,
  "aria-invalid": ariaInvalid,
  "aria-describedby": describedBy,
}: {
  value: string;
  onChange: (next: string) => void;
  onBlur?: () => void;
  id?: string;
  disabled?: boolean;
  swatches?: string[];
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          // See DateField: role=button does not support aria-invalid.
          data-invalid={ariaInvalid || undefined}
          aria-describedby={describedBy}
          aria-label={`Colour: ${value}`}
          className={cn(
            "flex h-(--size-field) cursor-pointer items-center gap-2.5 rounded-md bg-sunken px-3",
            "transition-[background-color,box-shadow] duration-150 hover:bg-sunken-2",
            "focus-visible:bg-card focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-focus)]",
            "data-[state=open]:bg-card data-[state=open]:shadow-[0_0_0_2px_var(--color-focus)]",
            "data-invalid:shadow-[0_0_0_2px_var(--color-critical)]",
            "disabled:cursor-not-allowed disabled:opacity-55",
            className,
          )}
        >
          <span
            className="size-5 shrink-0 rounded-md ring-1 ring-inset ring-black/10"
            style={{ backgroundColor: value }}
            aria-hidden
          />
          <span className="font-mono text-xs uppercase text-ink-2">{value}</span>
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-auto" padded={false}>
        <div className="grid grid-cols-6 gap-1.5 p-2.5" role="listbox" aria-label="Colour">
          {swatches.map((swatch) => {
            const active = swatch.toLowerCase() === value.toLowerCase();
            return (
              <button
                key={swatch}
                type="button"
                role="option"
                aria-selected={active}
                aria-label={swatch}
                onClick={() => {
                  onChange(swatch);
                  setOpen(false);
                  onBlur?.();
                }}
                className={cn(
                  "grid size-8 cursor-pointer place-items-center rounded-lg ring-1 ring-inset ring-black/10 transition-transform",
                  "hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
                )}
                style={{ backgroundColor: swatch }}
              >
                {active && <Check className="size-4 text-white drop-shadow" aria-hidden />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
