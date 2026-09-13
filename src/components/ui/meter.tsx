import { cn } from "@/lib/utils";

export function Meter({
  value,
  max = 100,
  tone = "solid",
  className,
  label,
}: {
  value: number;
  max?: number;
  tone?: "solid" | "accent" | "positive" | "caution" | "critical";
  className?: string;
  label?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const tones = {
    solid: "bg-solid",
    accent: "bg-accent-500",
    positive: "bg-positive",
    caution: "bg-caution",
    critical: "bg-critical",
  } as const;

  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-sunken", className)}
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-700", tones[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
