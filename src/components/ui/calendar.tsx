"use client";

import * as React from "react";
import { DayPicker, type DayPickerProps } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The month grid, skinned onto react-day-picker.
 *
 * We supply `classNames` for every element rather than importing the library's
 * stylesheet, so the calendar inherits our tokens (and therefore dark mode)
 * instead of shipping a second, competing visual language.
 */
export function Calendar({ className, classNames, showOutsideDays = true, ...props }: DayPickerProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col gap-4 sm:flex-row",
        month: "space-y-3",

        // The caption row: month name left, arrows right.
        month_caption: "flex h-8 items-center px-1",
        caption_label: "text-md font-semibold text-ink",
        nav: "absolute right-2 top-3 flex items-center gap-0.5",
        button_previous: cn(
          "inline-flex size-7 items-center justify-center rounded-lg text-ink-3",
          "transition-colors hover:bg-sunken hover:text-ink disabled:pointer-events-none disabled:opacity-30",
        ),
        button_next: cn(
          "inline-flex size-7 items-center justify-center rounded-lg text-ink-3",
          "transition-colors hover:bg-sunken hover:text-ink disabled:pointer-events-none disabled:opacity-30",
        ),

        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-9 text-2xs font-medium text-ink-3",
        weeks: "",
        week: "mt-1 flex w-full",

        day: cn(
          "relative size-9 p-0 text-center",
          // Range fills bleed to the cell edge so consecutive days join up.
          "[&:has([data-range-middle])]:bg-btn",
          "[&:has([data-range-start])]:rounded-l-lg [&:has([data-range-end])]:rounded-r-lg",
        ),
        day_button: cn(
          "inline-flex size-9 items-center justify-center rounded-lg text-base font-medium tnum text-ink",
          "transition-colors duration-100 hover:bg-sunken",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1",
          "disabled:pointer-events-none disabled:text-ink-3 disabled:line-through disabled:opacity-40",
        ),

        selected: "[&>button]:bg-solid [&>button]:font-semibold [&>button]:text-on-solid [&>button]:hover:bg-solid",
        // Today is a dot beneath the numeral, not a colour change: it stays
        // legible when today is also the selected day.
        today: "after:absolute after:bottom-1 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-pink",
        outside: "[&>button]:text-ink-3 [&>button]:opacity-45",
        disabled: "[&>button]:opacity-40",
        hidden: "invisible",
        range_middle: "[&>button]:rounded-none [&>button]:bg-transparent [&>button]:text-ink [&>button]:hover:bg-brand-100 dark:[&>button]:hover:bg-brand-900",
        range_start: "[&>button]:bg-solid [&>button]:text-on-solid",
        range_end: "[&>button]:bg-solid [&>button]:text-on-solid",

        footer: "px-1 pt-3 text-xs text-ink-3",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClass, ...rest }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
          return <Icon className={cn("size-4", chevronClass)} {...rest} />;
        },
      }}
      {...props}
    />
  );
}
