"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarDays, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Replaces `<input type="datetime-local">`.
 *
 * The native control renders a browser-drawn `mm/dd/yyyy --:--` spinner plus
 * Chrome's own calendar popup — different in every browser, unstyleable, and
 * hostile on touch. This keeps the exact same value format (`YYYY-MM-DDTHH:mm`,
 * local wall-clock, no timezone) so the zod schemas and API payloads are
 * unchanged, and only the interface differs.
 */

/** Local wall-clock string -> Date, without the UTC shift `new Date(s)` applies. */
export function parseLocal(value: string | undefined | null): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(value);
  if (!match) return null;
  const [, y, m, d, hh = "0", mm = "0"] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm));
  return Number.isNaN(date.getTime()) ? null : date;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function formatLocalDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatLocalDateTime(date: Date) {
  return `${formatLocalDate(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Every quarter hour of the day, as {value: "HH:mm", label: "10:30 PM"}. */
const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => {
  const hours = Math.floor(i / 4);
  const minutes = (i % 4) * 15;
  const at = new Date(2000, 0, 1, hours, minutes);
  return { value: `${pad(hours)}:${pad(minutes)}`, label: format(at, "h:mm a") };
});

const segment = cn(
  "flex h-9 items-center gap-2 rounded-lg bg-card px-2.5 text-md font-medium text-ink shadow-e1 transition-colors",
  "hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
  "data-[state=open]:bg-paper disabled:cursor-not-allowed disabled:opacity-60",
);

function TimeList({ value, onSelect }: { value: string; onSelect: (next: string) => void }) {
  const selectedRef = React.useRef<HTMLButtonElement>(null);

  // Open on the current time rather than at midnight — otherwise every edit
  // starts with a 40-row scroll.
  React.useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "center" });
  }, []);

  return (
    <div className="max-h-64 w-36 overflow-y-auto p-1.5" role="listbox" aria-label="Time">
      {TIME_OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            ref={active ? selectedRef : undefined}
            type="button"
            role="option"
            aria-selected={active}
            onClick={() => onSelect(option.value)}
            className={cn(
              "pop-item justify-center tnum",
              active && "bg-solid font-semibold text-on-solid hover:bg-solid",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function DateTimeField({
  value,
  onChange,
  onBlur,
  id,
  disabled,
  className,
  fromDate,
  "aria-invalid": ariaInvalid,
  "aria-describedby": describedBy,
}: {
  /** `YYYY-MM-DDTHH:mm`, local wall-clock. */
  value: string;
  onChange: (next: string) => void;
  onBlur?: () => void;
  id?: string;
  disabled?: boolean;
  className?: string;
  /** Days before this are not selectable. */
  fromDate?: Date;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  const [dateOpen, setDateOpen] = React.useState(false);
  const [timeOpen, setTimeOpen] = React.useState(false);

  const current = parseLocal(value);
  const time = current ? `${pad(current.getHours())}:${pad(current.getMinutes())}` : "09:00";

  function pickDate(day: Date | undefined) {
    if (!day) return;
    const [hh, mm] = time.split(":").map(Number);
    onChange(formatLocalDateTime(new Date(day.getFullYear(), day.getMonth(), day.getDate(), hh, mm)));
    setDateOpen(false);
    onBlur?.();
  }

  function pickTime(next: string) {
    const [hh, mm] = next.split(":").map(Number);
    const base = current ?? new Date();
    onChange(formatLocalDateTime(new Date(base.getFullYear(), base.getMonth(), base.getDate(), hh, mm)));
    setTimeOpen(false);
    onBlur?.();
  }

  return (
    <div
      id={id}
      aria-invalid={ariaInvalid}
      aria-describedby={describedBy}
      className={cn(
        "flex w-full items-center gap-1 rounded-md bg-sunken p-1",
        "transition-[background-color,box-shadow] duration-150",
        "focus-within:bg-card focus-within:shadow-[0_0_0_2px_var(--color-focus)]",
        "aria-[invalid=true]:shadow-[0_0_0_2px_var(--color-critical)]",
        disabled && "cursor-not-allowed opacity-55",
        className,
      )}
    >
      <Popover open={dateOpen} onOpenChange={setDateOpen}>
        <PopoverTrigger asChild>
          <button type="button" disabled={disabled} className={cn(segment, "min-w-0 flex-1")}>
            <CalendarDays className="size-4 shrink-0 text-ink-3" aria-hidden />
            <span className={cn("truncate", !current && "text-ink-3")}>
              {current ? format(current, "EEE, MMM d, yyyy") : "Pick a date"}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent padded={false} className="w-auto">
          <Calendar
            mode="single"
            selected={current ?? undefined}
            defaultMonth={current ?? undefined}
            onSelect={pickDate}
            disabled={fromDate ? { before: fromDate } : undefined}
            autoFocus
          />
        </PopoverContent>
      </Popover>

      <span className="h-5 w-px shrink-0 bg-line-2" aria-hidden />

      <Popover open={timeOpen} onOpenChange={setTimeOpen}>
        <PopoverTrigger asChild>
          <button type="button" disabled={disabled} className={cn(segment, "shrink-0 tnum")}>
            <Clock className="size-4 shrink-0 text-ink-3" aria-hidden />
            {current ? format(current, "h:mm a") : "—"}
          </button>
        </PopoverTrigger>
        <PopoverContent padded={false} align="end" className="w-auto">
          <TimeList value={time} onSelect={pickTime} />
        </PopoverContent>
      </Popover>
    </div>
  );
}

/** Date only, same contract but a `YYYY-MM-DD` value. */
export function DateField({
  value,
  onChange,
  onBlur,
  id,
  disabled,
  placeholder = "Pick a date",
  className,
  fromDate,
  toDate,
  "aria-invalid": ariaInvalid,
  "aria-describedby": describedBy,
}: {
  value: string;
  onChange: (next: string) => void;
  onBlur?: () => void;
  id?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  fromDate?: Date;
  toDate?: Date;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const current = parseLocal(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          // `aria-invalid` is not supported on role=button, so the invalid state
          // styles off a data attribute; the error text itself reaches assistive
          // tech through aria-describedby and its role="alert".
          data-invalid={ariaInvalid || undefined}
          aria-describedby={describedBy}
          className={cn(
            "flex h-(--size-field) w-full items-center gap-2 rounded-md bg-sunken px-3.5 text-md font-medium text-ink",
            "transition-[background-color,box-shadow] duration-150 hover:bg-sunken-2",
            "focus-visible:bg-card focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-focus)]",
            "data-[state=open]:bg-card data-[state=open]:shadow-[0_0_0_2px_var(--color-focus)]",
            "data-invalid:bg-card data-invalid:shadow-[0_0_0_2px_var(--color-critical)]",
            "disabled:cursor-not-allowed disabled:opacity-55",
            className,
          )}
        >
          <CalendarDays className="size-4 shrink-0 text-ink-3" aria-hidden />
          <span className={cn("truncate", !current && "text-ink-3")}>
            {current ? format(current, "EEE, MMM d, yyyy") : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent padded={false} className="w-auto">
        <Calendar
          mode="single"
          selected={current ?? undefined}
          defaultMonth={current ?? undefined}
          onSelect={(day) => {
            if (!day) return;
            onChange(formatLocalDate(day));
            setOpen(false);
            onBlur?.();
          }}
          disabled={
            fromDate || toDate ? { before: fromDate ?? new Date(0), after: toDate ?? new Date(8.64e15) } : undefined
          }
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
