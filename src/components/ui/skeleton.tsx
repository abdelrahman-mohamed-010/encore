import { cn } from "@/lib/utils";

/**
 * The only skeleton primitive in the app: one shimmering block. Every skeleton
 * is composed by sizing/rounding this exactly like the real element it stands
 * in for — colocate it next to that real component so they can't drift apart.
 */
export function Shimmer({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn("relative overflow-hidden rounded-lg bg-sunken", className)}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/[0.05] to-transparent dark:via-white/[0.06] [animation:sweep_1.6s_infinite]" />
    </div>
  );
}
