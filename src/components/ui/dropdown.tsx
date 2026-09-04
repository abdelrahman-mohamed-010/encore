"use client";

import * as React from "react";
import * as Primitive from "@radix-ui/react-dropdown-menu";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dropdown = Primitive.Root;
export const DropdownTrigger = Primitive.Trigger;

export function DropdownContent({
  className,
  align = "end",
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn("surface-pop motion-pop z-50 min-w-[13.75rem] p-1.5", className)}
        {...props}
      />
    </Primitive.Portal>
  );
}

export function DropdownItem({
  className,
  tone,
  ...props
}: React.ComponentProps<typeof Primitive.Item> & { tone?: "danger" }) {
  return (
    <Primitive.Item
      className={cn(
        "pop-item",
        tone === "danger" && "pop-item-danger",
        "data-[disabled]:pointer-events-none",
        "[&_svg]:size-[17px] [&_svg]:shrink-0 [&_svg]:text-ink-2",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownCheckItem({
  className,
  checked,
  children,
  ...props
}: React.ComponentProps<typeof Primitive.Item> & { checked?: boolean }) {
  return (
    <DropdownItem className={cn("justify-between", className)} {...props}>
      <span className="flex items-center gap-2.5">{children}</span>
      {checked && <Check className="!text-ink" />}
    </DropdownItem>
  );
}

export function DropdownLabel({ className, ...props }: React.ComponentProps<typeof Primitive.Label>) {
  return (
    <Primitive.Label
      className={cn("px-2.5 pb-1 pt-2 text-2xs font-semibold uppercase tracking-[0.07em] text-ink-3", className)}
      {...props}
    />
  );
}

export function DropdownSeparator({ className, ...props }: React.ComponentProps<typeof Primitive.Separator>) {
  return <Primitive.Separator className={cn("my-1 h-px bg-hairline-soft", className)} {...props} />;
}
