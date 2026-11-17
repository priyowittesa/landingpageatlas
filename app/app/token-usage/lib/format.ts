/**
 * Display formatters for the Token Usage module.
 *
 * - Token counts:  `181400` → `181,400`
 * - Percentages:   `75.62`  → `75.6%`
 * - Period range:  `2026-09-01` + `2026-09-20` → `Sep 1 - 20, 2026`
 * - Log timestamp: `2026-09-02T14:22:00Z` → `Sep 2, 2:22 PM`
 * - Relative time: `2026-09-02T14:22:00Z` → `17 min ago`
 */

const SHORT_DATE: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
};

const SHORT_DATE_YEAR: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
};

const SHORT_TIME: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
};

function parse(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function format(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions,
): string {
  const date = parse(value);
  if (!date) return value ?? "";
  try {
    return new Intl.DateTimeFormat("en-US", options).format(date);
  } catch {
    return value ?? "";
  }
}

/** `181400` → `181,400`. Renders an em dash for null/undefined. */
export function formatTokens(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "-";
  return value.toLocaleString("en-US");
}

/** `75.62` → `75.6%`. Trims a trailing `.0`. */
export function formatPercent(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "-";
  const rounded = Math.round(value * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}%`;
}

/** `2026-09-20` → `Sep 20, 2026`. */
export function formatShortDate(value: string | null | undefined): string {
  return format(value, SHORT_DATE_YEAR);
}

/** `2026-09-02T14:22:00Z` → `Sep 2, 2:22 PM`. */
export function formatDateTime(value: string | null | undefined): string {
  const date = parse(value);
  if (!date) return value ?? "";
  return `${format(value, SHORT_DATE)}, ${format(value, SHORT_TIME)}`;
}

/**
 * Collapse a start/end date into a single label.
 *   `Sep 1 - 20, 2026` when both fall in the same month and year
 *   `Sep 28 - Oct 4, 2026` otherwise
 */
export function formatPeriodRange(
  start: string | null | undefined,
  end: string | null | undefined,
): string {
  const from = parse(start);
  const to = parse(end);
  if (!from || !to) return formatShortDate(start ?? end);

  const sameMonth =
    from.getFullYear() === to.getFullYear() &&
    from.getMonth() === to.getMonth();

  return sameMonth
    ? `${format(start, SHORT_DATE)} - ${to.getDate()}, ${to.getFullYear()}`
    : `${format(start, SHORT_DATE)} - ${format(end, SHORT_DATE)}, ${to.getFullYear()}`;
}

export function formatMonthYear(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

export function shiftMonth(value: Date, amount: number): Date {
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + amount, 1),
  );
}

export function getMonthDateRange(value: Date): {
  from: string;
  to: string;
} {
  return {
    from: new Date(
      Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1),
    ).toISOString(),
    to: new Date(
      Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 1),
    ).toISOString(),
  };
}

/** `2026-09-02T14:22:00Z` → `17 min ago`. Falls back to an absolute date. */
export function formatRelativeTime(
  value: string | null | undefined,
  now: Date = new Date(),
): string {
  const date = parse(value);
  if (!date) return value ?? "";

  const minutes = Math.round((now.getTime() - date.getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;

  return formatShortDate(value);
}
