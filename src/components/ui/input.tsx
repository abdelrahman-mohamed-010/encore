import * as React from "react";
import { Search as SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shared shell for every text-entry control. Anything that is NOT text entry —
 * a select, a date, a colour — is a popover component of its own (see
 * select.tsx, date-picker.tsx, combobox.tsx, color-picker.tsx). Native
 * `<select>`, `<input type="date">` and `<input type="color">` are deliberately
 * not used anywhere in this app: the browser draws their popups itself, so they
 * cannot honour these tokens or dark mode.
 */
const control = [
  "w-full rounded-xl border border-hairline bg-card text-ink",
  "placeholder:text-ink-3 transition-[border-color,box-shadow] duration-150",
  "hover:border-n-300 dark:hover:border-n-700",
  "focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-500/20",
  "disabled:cursor-not-allowed disabled:bg-sunken disabled:opacity-60",
  "aria-[invalid=true]:border-critical aria-[invalid=true]:ring-critical/20",
].join(" ");

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(control, "h-(--size-field) px-3 text-base", className)}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(control, "min-h-28 resize-y px-3 py-2.5 text-base leading-relaxed", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

/** Text input with a leading icon, for search and filter bars. */
export const SearchInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }
>(({ className, icon, ...props }, ref) => (
  <div className="relative">
    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden>
      {icon ?? <SearchIcon className="size-4" />}
    </span>
    <input
      ref={ref}
      type="search"
      className={cn(control, "h-(--size-field) pl-9 pr-3 text-base", className)}
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
    <label className={cn("text-sm font-medium text-ink-2", className)} {...props}>
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
  children,
  className,
}: {
  label?: string;
  hint?: React.ReactNode;
  error?: string | null;
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-critical">{error}</p>
      ) : hint ? (
        <p className="text-xs leading-relaxed text-ink-3">{hint}</p>
      ) : null}
    </div>
  );
}

/** Input with a currency/unit affix that shares the control's border. */
export const AffixInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { prefix?: string; suffix?: string }
>(({ className, prefix, suffix, ...props }, ref) => (
  <div
    className={cn(
      "flex h-(--size-field) items-center rounded-xl border border-hairline bg-card",
      "transition-[border-color,box-shadow] duration-150",
      "focus-within:border-brand-500 focus-within:ring-[3px] focus-within:ring-brand-500/20",
      "has-[input[aria-invalid=true]]:border-critical has-[input[aria-invalid=true]]:ring-critical/20",
      className,
    )}
  >
    {prefix && <span className="pl-3 text-sm font-medium text-ink-3">{prefix}</span>}
    <input
      ref={ref}
      className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-base text-ink placeholder:text-ink-3 focus:outline-none"
      {...props}
    />
    {suffix && <span className="pr-3 text-sm font-medium text-ink-3">{suffix}</span>}
  </div>
));
AffixInput.displayName = "AffixInput";

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
        "relative inline-flex h-6 w-10 shrink-0 items-center rounded-full border border-transparent",
        "transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
        checked ? "bg-brand-600 dark:bg-brand-500" : "bg-n-300 dark:bg-n-700",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <span
        className={cn(
          "size-5 rounded-full bg-white shadow-e1 transition-transform duration-200 ease-(--ease-spring)",
          checked ? "translate-x-[18px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
