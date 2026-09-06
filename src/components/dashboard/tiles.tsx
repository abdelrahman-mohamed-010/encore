import Link from "next/link";
import { CHIP_TONES } from "@/components/ui/field-row";
import { cn } from "@/lib/utils";

/**
 * The reference's quick-action tile: a coloured icon chip, a label, and an
 * optional value underneath. Used as a row of three at the top of a pane,
 * where it doubles as a shortcut and as a readout of the current setting.
 */
export function QuickAction({
  icon: Icon,
  tone = "neutral",
  label,
  value,
  href,
  onClick,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone?: keyof typeof CHIP_TONES;
  label: string;
  value?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}) {
  const body = (
    <>
      <span
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-xl border",
          CHIP_TONES[tone],
        )}
      >
        <Icon className="size-[22px]" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-md font-medium text-ink">{label}</span>
        {value !== undefined && (
          <span className="mt-0.5 block truncate text-base text-ink-2">{value}</span>
        )}
      </span>
    </>
  );

  const classes = cn(
    "flex w-full items-center gap-4 rounded-xl bg-card p-3 text-left transition-colors hover:bg-sunken/60",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {body}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={classes}>
      {body}
    </button>
  );
}

/**
 * The reference's "plain card": an icon chip, a bold lead line and a sentence.
 * It is the empty state for a section that has no rows yet — quieter than a
 * full empty state because the section heading above already says what this is.
 */
export function PlainCard({
  icon: Icon,
  tone = "neutral",
  title,
  children,
  action,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone?: keyof typeof CHIP_TONES;
  title: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl bg-card px-5 py-3.5",
        className,
      )}
    >
      <span
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-xl border",
          CHIP_TONES[tone],
        )}
      >
        <Icon className="size-[22px]" />
      </span>
      <div className="min-w-0 flex-1 text-base leading-relaxed text-ink-2">
        <p className="font-semibold text-ink">{title}</p>
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** A section heading with an optional trailing action, then an optional lede. */
export function SectionBlock({
  title,
  description,
  action,
  children,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <h2 className="text-xl font-bold tracking-[-0.02em] text-ink">{title}</h2>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {description && (
        <p className="mt-2 max-w-prose text-base leading-relaxed text-ink-2">{description}</p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </section>
  );
}
