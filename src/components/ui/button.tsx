import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap",
    "font-medium transition-[background-color,border-color,color,opacity,transform] duration-150",
    "disabled:pointer-events-none disabled:opacity-45",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        /** Near-black in light, near-white in dark. The one high-emphasis action. */
        solid: "bg-solid text-on-solid hover:opacity-88 active:opacity-95",
        /** Default surface action: hairline border, no shadow noise. */
        outline: "border border-hairline bg-card text-ink hover:bg-sunken",
        /** Lowest emphasis: nothing until hovered. */
        ghost: "text-ink-2 hover:bg-sunken hover:text-ink",
        /** Inset chip sitting on a card. */
        soft: "bg-sunken text-ink hover:bg-n-150 dark:hover:bg-n-800",
        accent: "bg-accent-600 text-white hover:bg-accent-700",
        danger: "bg-critical text-white hover:opacity-90",
        link: "h-auto p-0 text-accent-600 underline-offset-4 hover:underline dark:text-accent-400",
      },
      size: {
        xs: "h-7 rounded-md px-2.5 text-[12px] [&_svg]:size-3.5",
        sm: "h-8 rounded-md px-3 text-[13px] [&_svg]:size-3.5",
        md: "h-10 rounded-lg px-4 text-sm [&_svg]:size-4",
        lg: "h-11 rounded-lg px-5 text-[15px] [&_svg]:size-4",
        xl: "h-13 rounded-xl px-6 text-base [&_svg]:size-[18px]",
        icon: "size-10 rounded-lg [&_svg]:size-4",
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
