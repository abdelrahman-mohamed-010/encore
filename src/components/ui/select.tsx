"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Replaces the native `<select>`.
 *
 * A native select's list is drawn by the operating system, so CSS cannot touch
 * it: it ignores our surface, radius, font and dark mode entirely. Radix renders
 * the list as real DOM in a portal — keeping the keyboard behaviour, typeahead
 * and screen-reader semantics of the native element — which is what lets it be
 * styled to match the rest of the system.
 */

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

const TRIGGER_SIZES = {
  sm: "h-(--size-field-sm) rounded-lg px-2.5 text-sm",
  md: "h-(--size-field) rounded-xl px-3 text-base",
  lg: "h-(--size-field-lg) rounded-xl px-3.5 text-md",
} as const;

export const SelectTrigger = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    size?: keyof typeof TRIGGER_SIZES;
  }
>(({ className, size = "md", children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "group flex w-full items-center justify-between gap-2 border border-hairline bg-card text-ink",
      "transition-[border-color,box-shadow] duration-150",
      "hover:border-n-300 dark:hover:border-n-700",
      "focus:outline-none focus-visible:border-brand-500 focus-visible:ring-[3px] focus-visible:ring-brand-500/20",
      "data-[state=open]:border-brand-500 data-[state=open]:ring-[3px] data-[state=open]:ring-brand-500/20",
      "data-[placeholder]:text-ink-3",
      "disabled:cursor-not-allowed disabled:bg-sunken disabled:opacity-60",
      "aria-[invalid=true]:border-critical aria-[invalid=true]:ring-critical/20",
      TRIGGER_SIZES[size],
      className,
    )}
    {...props}
  >
    <span className="min-w-0 flex-1 truncate text-left">{children}</span>
    <SelectPrimitive.Icon asChild>
      <ChevronDown
        className="size-4 shrink-0 text-ink-3 transition-transform duration-200 group-data-[state=open]:rotate-180"
        aria-hidden
      />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = "SelectTrigger";

function ScrollButton({ dir }: { dir: "up" | "down" }) {
  const Cmp = dir === "up" ? SelectPrimitive.ScrollUpButton : SelectPrimitive.ScrollDownButton;
  const Icon = dir === "up" ? ChevronUp : ChevronDown;
  return (
    <Cmp className="flex h-6 items-center justify-center bg-card text-ink-3">
      <Icon className="size-3.5" aria-hidden />
    </Cmp>
  );
}

export const SelectContent = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      sideOffset={6}
      className={cn(
        "surface-pop motion-pop z-50 text-ink",
        "max-h-[min(22rem,var(--radix-select-content-available-height))]",
        // Match the trigger's width so the menu reads as an extension of it.
        position === "popper" && "w-full min-w-(--radix-select-trigger-width)",
        className,
      )}
      {...props}
    >
      <ScrollButton dir="up" />
      <SelectPrimitive.Viewport className="p-1.5">{children}</SelectPrimitive.Viewport>
      <ScrollButton dir="down" />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = "SelectContent";

export const SelectItem = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & { hint?: string }
>(({ className, children, hint, ...props }, ref) => (
  <SelectPrimitive.Item ref={ref} className={cn("pop-item pr-2", className)} {...props}>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    {hint && <span className="ml-auto shrink-0 text-xs tnum text-ink-3">{hint}</span>}
    <SelectPrimitive.ItemIndicator className={cn("shrink-0 text-brand-600", !hint && "ml-auto")}>
      <Check className="size-4" aria-hidden />
    </SelectPrimitive.ItemIndicator>
  </SelectPrimitive.Item>
));
SelectItem.displayName = "SelectItem";

export function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      className={cn("px-2.5 pb-1 pt-2 text-2xs font-semibold uppercase tracking-wider text-ink-3", className)}
      {...props}
    />
  );
}

export function SelectSeparator({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return <SelectPrimitive.Separator className={cn("my-1.5 h-px bg-hairline-soft", className)} {...props} />;
}

/**
 * The common case in one component: a list of options, no composition needed.
 * Accepts and emits plain strings so it drops straight into a form field.
 */
export function SelectField({
  value,
  onChange,
  options,
  placeholder = "Select…",
  size,
  disabled,
  className,
  id,
  name,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
  "aria-describedby": describedBy,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; hint?: string; disabled?: boolean }[];
  placeholder?: string;
  size?: keyof typeof TRIGGER_SIZES;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  /** Required whenever no visible <label> points at the trigger. */
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled} name={name}>
      <SelectTrigger
        id={id}
        size={size}
        className={className}
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
        aria-describedby={describedBy}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            hint={option.hint}
            disabled={option.disabled}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
