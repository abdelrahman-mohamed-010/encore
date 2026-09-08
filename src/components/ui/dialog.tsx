"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  size = "md",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl" } as const;

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="animate-fade fixed inset-0 z-50 bg-n-1000/45 backdrop-blur-[2px]" />
      <DialogPrimitive.Content
        className={cn(
          "animate-rise fixed left-1/2 top-1/2 z-50 flex w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col",
          "max-h-[calc(100dvh-3rem)] overflow-hidden rounded-xl bg-card shadow-pop",
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

export function DialogHeader({
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

export function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("text-md font-semibold text-ink", className)} {...props} />;
}

export function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description className={cn("text-sm leading-relaxed text-ink-3", className)} {...props} />
  );
}

export function DialogBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("min-h-0 flex-1 overflow-y-auto px-5 py-4", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
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
