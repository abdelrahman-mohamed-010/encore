import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap",
    // Slightly negative tracking: button labels are short and set in a row, so
    // default spacing reads loose next to the tighter headings around them.
    "font-medium tracking-[-0.011em] transition-[background-color,border-color,color,opacity,transform] duration-150",
    "disabled:pointer-events-none disabled:opacity-45",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        /**
         * The one high-emphasis action per view. Brand-filled, so a page's
         * primary action is findable by colour rather than by position.
         */
        primary:
          "bg-primary text-on-primary shadow-e1 hover:bg-primary-hover active:translate-y-px",
        /** Neutral high-emphasis: near-black in light, near-white in dark. */
        solid: "bg-solid text-on-solid hover:bg-solid-hover active:translate-y-px",
        /** Default surface action: hairline border, no shadow noise. */
        outline: "border border-hairline bg-card text-ink hover:bg-sunken hover:border-n-300 dark:hover:border-n-700",
        /** Lowest emphasis: nothing until hovered. */
        ghost: "text-ink-2 hover:bg-sunken hover:text-ink",
        /** Inset chip sitting on a card. */
        soft: "bg-sunken text-ink hover:bg-n-150 dark:hover:bg-n-800",
        /** Brand-tinted, for a secondary action that still belongs to the brand. */
        accent: "bg-primary-soft text-brand-700 hover:bg-brand-100 dark:text-brand-200 dark:hover:bg-brand-900",
        danger: "bg-critical text-white hover:opacity-90 active:translate-y-px",
        "danger-soft": "bg-critical-bg text-critical hover:bg-critical hover:text-white",
        link: "h-auto p-0 text-brand-600 underline-offset-4 hover:underline dark:text-brand-400",
      },
      size: {
        xs: "h-7 rounded-md px-2.5 text-xs [&_svg]:size-3.5",
        sm: "h-8 rounded-md px-3 text-sm [&_svg]:size-3.5",
        md: "h-(--size-field) rounded-lg px-4 text-base [&_svg]:size-4",
        lg: "h-(--size-field-lg) rounded-lg px-5 text-md [&_svg]:size-[18px]",
        xl: "h-13 rounded-xl px-7 text-lg [&_svg]:size-5",
        icon: "size-(--size-field) rounded-lg [&_svg]:size-4",
        "icon-sm": "size-8 rounded-md [&_svg]:size-4",
        "icon-xs": "size-7 rounded-md [&_svg]:size-3.5",
      },
      block: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "outline", size: "md", block: false },
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
    { className, variant, size, block, asChild = false, loading = false, children, disabled, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, block, className }))}
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
            {loading && <Loader2 className="animate-spin" aria-hidden />}
            {children}
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
