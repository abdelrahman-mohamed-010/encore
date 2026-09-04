"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

/**
 * The floating-panel primitive every custom control is built on: select menus,
 * comboboxes, date pickers, colour swatches. They share `surface-pop` and
 * `motion-pop` so that a menu, a calendar and a search list read as the same
 * physical object rather than three separately-styled boxes.
 */

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;
export const PopoverClose = PopoverPrimitive.Close;

export const PopoverContent = React.forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & { padded?: boolean }
>(({ className, align = "start", sideOffset = 6, padded = true, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "surface-pop motion-pop z-50 text-ink",
        // Never taller than the viewport: Radix measures the space available
        // and exposes it, so long lists scroll instead of overflowing offscreen.
        "max-h-[min(28rem,var(--radix-popover-content-available-height))] overflow-y-auto",
        padded && "p-1.5",
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = "PopoverContent";
