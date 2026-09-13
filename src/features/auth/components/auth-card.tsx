import { cn } from "@/lib/utils";

/**
 * The content of an auth screen: heading, the form, and the link to the other
 * screen. There is no card — a white box on off-white paper was adding an edge
 * you could barely see and no structure, and the split layout already gives
 * the form its own half of the page.
 */
export function AuthCard({
  title,
  description,
  children,
  footer,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("animate-rise", className)}>
      <h1 className="display-3 font-flourish text-ink">{title}</h1>
      {description && (
        <p className="mt-2.5 text-base leading-relaxed text-ink-2">{description}</p>
      )}

      <div className="mt-8">{children}</div>

      {footer && <p className="mt-8 text-sm text-ink-2">{footer}</p>}
    </div>
  );
}
