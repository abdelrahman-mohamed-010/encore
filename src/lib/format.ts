/** Money, dates and small display helpers. All amounts are integer cents. */

export function formatMoney(cents: number, currency = "USD", locale = "en-US") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/** Compact money for dashboard tiles: $12.4k, $1.2M. */
export function formatMoneyCompact(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(cents / 100);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

const DATE_STYLES = {
  full: { weekday: "long", day: "numeric", month: "long", year: "numeric" },
  long: { day: "numeric", month: "long", year: "numeric" },
  medium: { day: "numeric", month: "short", year: "numeric" },
  short: { day: "numeric", month: "short" },
} satisfies Record<string, Intl.DateTimeFormatOptions>;

export function formatDate(
  value: string | Date,
  style: keyof typeof DATE_STYLES = "medium",
  timeZone?: string,
) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", { ...DATE_STYLES[style], timeZone }).format(date);
}

export function formatTime(value: string | Date, timeZone?: string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(date);
}

export function formatDateTime(value: string | Date, timeZone?: string) {
  return `${formatDate(value, "medium", timeZone)} · ${formatTime(value, timeZone)}`;
}

/** "Fri, 12 Jun · 8:00 PM" — the compact form used on event cards. */
export function formatEventStamp(value: string | Date, timeZone?: string) {
  const date = typeof value === "string" ? new Date(value) : value;
  const day = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone,
  }).format(date);
  return `${day} · ${formatTime(date, timeZone)}`;
}

/** Split a date into the parts a calendar chip needs. */
export function calendarParts(value: string | Date, timeZone?: string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return {
    month: new Intl.DateTimeFormat("en-US", { month: "short", timeZone }).format(date).toUpperCase(),
    day: new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone }).format(date),
    weekday: new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone }).format(date),
  };
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000_000],
  ["month", 2_592_000_000],
  ["week", 604_800_000],
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

export function formatRelative(value: string | Date, now: Date = new Date()) {
  const date = typeof value === "string" ? new Date(value) : value;
  const diff = date.getTime() - now.getTime();
  const formatter = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });

  for (const [unit, ms] of RELATIVE_UNITS) {
    if (Math.abs(diff) >= ms) {
      return formatter.format(Math.round(diff / ms), unit);
    }
  }
  return formatter.format(Math.round(diff / 1000), "second");
}

/** mm:ss for the checkout countdown. */
export function formatCountdown(msRemaining: number) {
  const total = Math.max(0, Math.floor(msRemaining / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
}

/** "From $45" / "Free" / "$45 – $180" for an event's price range. */
export function priceRange(minCents: number, maxCents: number, currency = "USD") {
  if (maxCents <= 0) return "Free";
  if (minCents <= 0) return `Free – ${formatMoney(maxCents, currency)}`;
  if (minCents === maxCents) return formatMoney(minCents, currency);
  return `From ${formatMoney(minCents, currency)}`;
}

export function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
