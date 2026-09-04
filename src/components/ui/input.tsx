import * as React from "react";
import { Search as SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Text entry.
 *
 * Fields are FILLED, not outlined: at rest they are a soft grey block with no
 * border at all, and only on focus do they lift to the card colour and take a
 * ring. A dense form then reads as a column of soft slabs instead of a grid of
 * boxes, which is the single biggest reason the reference feels calm.
 *
 * Anything that is not text entry — a select, a date, a colour — is a popover
 * component of its own. Native `<select>`, `<input type="date|color">` are
 * never used: the browser draws their popups and they cannot honour these
 * tokens or dark mode.
 */
const control = [
  "w-full rounded-md border-0 bg-sunken text-ink outline-none",
  "placeholder:text-ink-3",
  "transition-[background-color,box-shadow] duration-150",
  "hover:bg-sunken-2",
  "focus:bg-card focus:shadow-[0_0_0_2px_var(--color-focus)]",
  "disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-sunken",
  "aria-[invalid=true]:bg-card aria-[invalid=true]:shadow-[0_0_0_2px_var(--color-critical)]",
].join(" ");

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(control, "h-(--size-field) px-3.5 text-md", className)} {...props} />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(control, "min-h-28 resize-y px-3.5 py-3 text-md leading-relaxed", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

/** Text input with a leading icon, for search and filter bars. */
export const SearchInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }
>(({ className, icon, ...props }, ref) => (
  <div className="relative flex items-center">
    <span className="pointer-events-none absolute left-3.5 text-ink-2" aria-hidden>
      {icon ?? <SearchIcon className="size-[18px]" />}
    </span>
    <input
      ref={ref}
      type="search"
      className={cn(control, "h-(--size-field) pl-11 pr-3.5 text-md", className)}
      {...props}
    />
  </div>
));
SearchInput.displayName = "SearchInput";

export function Label({
  className,
  required,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label className={cn("text-sm font-medium text-ink", className)} {...props}>
      {children}
      {required && <span className="ml-0.5 text-critical">*</span>}
    </label>
  );
}

/** Label + control + hint/error, on a fixed vertical rhythm. */
export function Field({
  label,
  hint,
  error,
  htmlFor,
  required,
  optional,
  children,
  className,
}: {
  label?: string;
  hint?: React.ReactNode;
  error?: string | null;
  htmlFor?: string;
  required?: boolean;
  /** Renders a quiet "Optional" opposite the label. */
  optional?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <span className="flex items-baseline justify-between gap-3">
          <Label htmlFor={htmlFor} required={required}>
            {label}
          </Label>
          {optional && <span className="text-2xs tracking-normal text-ink-3">Optional</span>}
        </span>
      )}
      {children}
      {error ? (
        <p className="text-xs text-critical">{error}</p>
      ) : hint ? (
        <p className="text-xs leading-relaxed text-ink-2">{hint}</p>
      ) : null}
    </div>
  );
}

/**
 * Input with a unit affix. The affix is a slightly deeper slab butted against
 * the field, so the pair still reads as one control.
 */
export const AffixInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { prefix?: string; suffix?: string }
>(({ className, prefix, suffix, ...props }, ref) => (
  <div
    className={cn(
      "flex h-(--size-field) items-stretch overflow-hidden rounded-md bg-sunken",
      "transition-[background-color,box-shadow] duration-150",
      "focus-within:bg-card focus-within:shadow-[0_0_0_2px_var(--color-focus)]",
      "has-[input[aria-invalid=true]]:shadow-[0_0_0_2px_var(--color-critical)]",
      className,
    )}
  >
    {prefix && (
      <span className="flex items-center bg-sunken-2 px-3 text-base text-ink-2">{prefix}</span>
    )}
    <input
      ref={ref}
      className="min-w-0 flex-1 bg-transparent px-3.5 text-md text-ink placeholder:text-ink-3 outline-none"
      {...props}
    />
    {suffix && (
      <span className="flex items-center bg-sunken-2 px-3 text-base text-ink-2">{suffix}</span>
    )}
  </div>
));
AffixInput.displayName = "AffixInput";

/**
 * The toggle. Green when on — this is a state, not a brand moment, and the
 * reference uses the positive colour precisely because "on" is the good case.
 */
export function Switch({
  checked,
  onCheckedChange,
  disabled,
  label,
  className,
}: {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6.5 w-11 shrink-0 items-center rounded-full",
        "transition-colors duration-200",
        checked ? "bg-positive" : "bg-line-2",
        disabled && "cursor-not-allowed opacity-40",
        className,
      )}
    >
      <span
        className={cn(
          "size-5 rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/0.25)]",
          "transition-transform duration-200 ease-(--ease-out-quint)",
          checked ? "translate-x-[22px]" : "translate-x-[3px]",
        )}
      />
    </button>
  );
}

/** A labelled switch on its own row, as used through the settings screens. */
export function SwitchRow({
  title,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  title: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-hairline py-3.5 last:border-b-0">
      <div className="min-w-0">
        <p className="font-medium text-ink">{title}</p>
        {description && <p className="mt-0.5 text-sm text-ink-2">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} label={title} />
    </div>
  );
}

/** Numeric stepper — the ticket-quantity control. */
export function Stepper({
  value,
  onChange,
  min = 0,
  max = 99,
  disabled,
  label,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <div className="inline-flex h-(--size-field) items-center rounded-md bg-sunken p-1">
      <button
        type="button"
        aria-label={`Remove one${label ? ` ${label}` : ""}`}
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="grid size-9 place-items-center rounded-[7px] text-ink-2 transition-[background-color,box-shadow] hover:bg-card hover:text-ink hover:shadow-e1 disabled:pointer-events-none disabled:opacity-35"
      >
        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M5 12h14" />
        </svg>
      </button>
      <span className="w-12 text-center text-md font-semibold tnum text-ink">{value}</span>
      <button
        type="button"
        aria-label={`Add one${label ? ` ${label}` : ""}`}
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="grid size-9 place-items-center rounded-[7px] text-ink-2 transition-[background-color,box-shadow] hover:bg-card hover:text-ink hover:shadow-e1 disabled:pointer-events-none disabled:opacity-35"
      >
        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M5 12h14M12 5v14" />
        </svg>
      </button>
    </div>
  );
}
