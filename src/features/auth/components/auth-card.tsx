import { cn } from "@/lib/utils";

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
      <div className="mb-7 text-center">
        <h1 className="display-3 text-ink">{title}</h1>
        {description && (
          <p className="mt-2 text-base leading-relaxed text-ink-2">{description}</p>
        )}
      </div>

      <div className="rounded-2xl bg-card shadow-e1 p-6">{children}</div>

      {footer && <div className="mt-6 text-center text-sm text-ink-2">{footer}</div>}
    </div>
  );
}
