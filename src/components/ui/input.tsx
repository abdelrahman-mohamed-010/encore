import * as React from "react";
import { cn } from "@/lib/utils";

const control = [
  "w-full rounded-lg border border-hairline bg-card text-ink",
  "placeholder:text-ink-3 transition-colors duration-150",
  "hover:border-n-300 dark:hover:border-n-700",
  "focus-visible:border-accent-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-500/18",
  "disabled:cursor-not-allowed disabled:bg-sunken disabled:opacity-60",
  "aria-[invalid=true]:border-critical aria-[invalid=true]:ring-critical/18",
].join(" ");

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(control, "h-10 px-3 text-[14px]", className)} {...props} />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(control, "min-h-28 resize-y px-3 py-2.5 text-[14px] leading-relaxed", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

const CHEVRON =
  "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, style, ...props }, ref) => (
  <select
    ref={ref}
    style={{ backgroundImage: CHEVRON, ...style }}
    className={cn(
      control,
      "h-10 cursor-pointer appearance-none bg-[length:1rem_1rem] bg-[right_0.625rem_center] bg-no-repeat pl-3 pr-9 text-[14px]",
      className,
    )}
    {...props}
  />
));
Select.displayName = "Select";

export function Label({
  className,
  required,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label className={cn("text-[13px] font-medium text-ink-2", className)} {...props}>
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
        <p className="text-[12px] text-critical">{error}</p>
      ) : hint ? (
        <p className="text-[12px] leading-relaxed text-ink-3">{hint}</p>
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
      "flex h-10 items-center rounded-lg border border-hairline bg-card transition-colors",
      "focus-within:border-accent-500 focus-within:ring-[3px] focus-within:ring-accent-500/18",
      className,
    )}
  >
    {prefix && <span className="pl-3 text-[13px] text-ink-3">{prefix}</span>}
    <input
      ref={ref}
      className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-[14px] text-ink placeholder:text-ink-3 focus:outline-none"
      {...props}
    />
    {suffix && <span className="pr-3 text-[13px] text-ink-3">{suffix}</span>}
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
        "relative inline-flex h-6 w-10 shrink-0 items-center rounded-full border border-transparent transition-colors duration-200",
        checked ? "bg-solid" : "bg-n-300 dark:bg-n-700",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <span
        className={cn(
          "size-5 rounded-full bg-white shadow-e1 transition-transform duration-200",
          checked ? "translate-x-[18px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
