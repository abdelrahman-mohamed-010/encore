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
        <h1 className="text-[26px] font-semibold tracking-[-0.03em] text-ink">{title}</h1>
        {description && (
          <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{description}</p>
        )}
      </div>

      <div className="rounded-2xl border border-hairline bg-card p-6">{children}</div>

      {footer && <div className="mt-6 text-center text-[13.5px] text-ink-2">{footer}</div>}
    </div>
  );
}
