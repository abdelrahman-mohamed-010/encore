"use client";

import * as React from "react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";

/**
 * A bottom sheet for touch. Filters, seat details and ticket pickers are
 * unusable as centred dialogs on a phone — a sheet keeps them thumb-reachable
 * and drag-dismissable, while the same content stays a dialog on desktop.
 */

export const Sheet = Drawer.Root;
export const SheetTrigger = Drawer.Trigger;
export const SheetClose = Drawer.Close;

export function SheetContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Drawer.Content>) {
  return (
    <Drawer.Portal>
      <Drawer.Overlay className="fixed inset-0 z-50 bg-overlay backdrop-blur-[2px]" />
      <Drawer.Content
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[92dvh] flex-col",
          "rounded-t-3xl border-t border-hairline bg-card outline-none",
          className,
        )}
        {...props}
      >
        {/* The grab handle is the affordance that says "drag me down". */}
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-n-300 dark:bg-n-700" aria-hidden />
        {children}
      </Drawer.Content>
    </Drawer.Portal>
  );
}

export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("shrink-0 space-y-1 px-5 pb-3 pt-4", className)} {...props} />;
}

export function SheetTitle({ className, ...props }: React.ComponentProps<typeof Drawer.Title>) {
  return <Drawer.Title className={cn("text-[17px] font-semibold text-ink", className)} {...props} />;
}

export function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof Drawer.Description>) {
  return (
    <Drawer.Description
      className={cn("text-[13.5px] leading-relaxed text-ink-2", className)}
      {...props}
    />
  );
}

export function SheetBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("min-h-0 flex-1 overflow-y-auto px-5 pb-2", className)} {...props} />;
}

export function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "shrink-0 border-t border-hairline-soft px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3",
        className,
      )}
      {...props}
    />
  );
}
