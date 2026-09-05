import { cn } from "@/lib/utils";

export function VerifiedBadge({
  size = "md",
  className,
  showLabel = false,
}: {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}) {
  const sizeClasses = {
    xs: "size-3.5",
    sm: "size-4",
    md: "size-4.5",
    lg: "size-5",
  };

  const badge = (
    <svg
      viewBox="0 0 24 24"
      aria-label="Verified"
      className={cn(
        sizeClasses[size],
        "shrink-0 text-[#2563eb] dark:text-[#3b82f6]",
        className
      )}
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
      />
    </svg>
  );

  if (!showLabel) return badge;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
      {badge}
      <span>Verified</span>
    </span>
  );
}
