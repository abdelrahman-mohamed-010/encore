import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Buttons.
 *
 * Two things define the look:
 *
 *  1. The resting state is a filled grey chip, not an outline. A row of
 *     actions reads as a set of soft keys rather than a row of boxes.
 *  2. The emphatic action is near-black, never brand-coloured. Colour in this
 *     system means status; hierarchy is carried by weight. The one gradient
 *     (`brand`) is reserved for a single conversion action per page.
 *
 * Loading hides the label instead of replacing it, so the button keeps its
 * width and the row around it never reflows mid-submit.
 */
const buttonVariants = cva(
  [
    "relative inline-flex cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap",
    "font-medium transition-[background-color,box-shadow,filter,transform] duration-150",
    "active:translate-y-px",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 disabled:active:translate-y-0",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        /** Default: a soft filled key. */
        soft: "bg-btn text-ink hover:bg-btn-h",
        /** The one high-emphasis action per view. */
        solid: "bg-solid text-on-solid hover:bg-solid-hover",
        /** Alias of solid — components that speak in "primary". */
        primary: "bg-solid text-on-solid hover:bg-solid-hover",
        /** The single gradient. One per page, for the real conversion. */
        brand: "bg-brand text-white hover:brightness-[1.06]",
        outline: "bg-transparent text-ink shadow-[inset_0_0_0_1.5px_var(--color-line-2)] hover:bg-btn",
        ghost: "bg-transparent text-ink-2 hover:bg-btn hover:text-ink",
        accent: "bg-brand-100 text-brand-700 hover:bg-brand-200 dark:text-brand-200 dark:hover:bg-brand-900",
        danger: "bg-critical-bg text-critical hover:brightness-95",
        "danger-solid": "bg-critical text-white hover:brightness-95",
        link: "h-auto p-0 text-ink underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-7 rounded-md px-2.5 text-xs [&_svg]:size-3.5",
        sm: "h-8 rounded-md px-3 text-sm [&_svg]:size-[15px]",
        md: "h-(--size-btn) rounded-md px-3.5 text-md [&_svg]:size-[17px]",
        lg: "h-12 rounded-[11px] px-5 text-lg [&_svg]:size-[19px]",
        xl: "h-14 rounded-[14px] px-6.5 text-xl [&_svg]:size-5",
        icon: "size-(--size-btn) rounded-md [&_svg]:size-[17px]",
        "icon-sm": "size-8 rounded-md [&_svg]:size-[15px]",
        "icon-xs": "size-7 rounded-md [&_svg]:size-3.5",
      },
      block: { true: "w-full", false: "" },
      round: { true: "rounded-full", false: "" },
    },
    defaultVariants: { variant: "soft", size: "md", block: false, round: false },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, block, round, asChild = false, loading = false, children, disabled, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const dark = variant === "solid" || variant === "primary" || variant === "brand" || variant === "danger-solid";

    return (
      <Comp
        ref={ref}
        className={cn(
          buttonVariants({ variant, size, block, round, className }),
          loading && "pointer-events-none text-transparent!",
        )}
        disabled={disabled || loading}
        data-loading={loading || undefined}
        {...props}
      >
        {/* Slot accepts exactly one child, so an asChild button (always a link)
            renders its child untouched rather than gaining a spinner sibling. */}
        {asChild ? (
          children
        ) : (
          <>
            {loading && (
              <span
                aria-hidden
                className={cn(
                  "absolute size-4 animate-spin rounded-full border-2",
                  dark
                    ? "border-white/35 border-t-white"
                    : "border-ink-3/35 border-t-ink-2",
                )}
              />
            )}
            {children}
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

/** A keyboard hint that sits inside a button or a menu row. */
export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] bg-card px-1.5",
        "font-mono text-2xs font-medium tracking-normal text-ink-2",
        "shadow-[inset_0_0_0_1px_var(--color-line-2),0_1px_0_var(--color-line-2)]",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

export { buttonVariants };
