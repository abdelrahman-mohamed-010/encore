import { cn } from "@/lib/utils";

/**
 * Icon, title, description, and one action on the right — the row both
 * settings screens use for password reset, Stripe and the like. Two loading
 * skeletons were also mirroring its 130-character class list by hand.
 */
export function SettingsRow({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between gap-4 rounded-2xl border border-hairline/70 bg-card/60 p-4.5 sm:flex-row sm:items-center",
        className,
      )}
    >
      <div className="flex items-start gap-3.5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sunken text-ink-2">
          <Icon className="size-5" />
        </span>
        <div>
          <h4 className="text-sm font-semibold text-ink">{title}</h4>
          <p className="text-xs text-ink-3">{description}</p>
        </div>
      </div>

      {action}
    </div>
  );
}
