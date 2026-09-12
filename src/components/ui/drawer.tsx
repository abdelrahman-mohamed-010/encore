"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A right-side floating panel — a `Dialog` that slides in from the edge
 * instead of the centre. Insets on every side (never flush with the
 * viewport) and rounded all four corners keep it reading as the same
 * physical object as `Dialog`, just anchored differently.
 */

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;

export function DrawerContent({
  className,
  children,
  size = "md",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-xl" } as const;

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="animate-fade fixed inset-0 z-50 bg-n-1000/45 backdrop-blur-[2px]" />
      <DialogPrimitive.Content
        className={cn(
          "animate-slide-in-right fixed inset-y-3 right-3 z-50 flex w-[calc(100vw-1.5rem)] flex-col",
          "rounded-2xl bg-card shadow-pop",
          "focus:outline-none",
          sizes[size],
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DrawerHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("relative flex shrink-0 flex-col gap-1 border-b border-hairline-soft px-5 py-4 pr-12", className)}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        className="absolute right-3.5 top-3.5 grid size-8 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-sunken hover:text-ink"
        aria-label="Close"
      >
        <X className="size-4" />
      </DialogPrimitive.Close>
    </div>
  );
}

export function DrawerTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("text-md font-semibold text-ink", className)} {...props} />;
}

export function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description className={cn("text-sm leading-relaxed text-ink-3", className)} {...props} />
  );
}

export function DrawerBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("min-h-0 flex-1 overflow-y-auto px-5 py-4", className)} {...props} />;
}

export function DrawerFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col-reverse gap-2 border-t border-hairline-soft px-5 py-3.5 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}
