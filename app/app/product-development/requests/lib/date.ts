/**
 * Date format helpers for engineering request payloads.
 *
 * - Display (table, list, detail): `01 January 2026` ("dd MMMM yyyy")
 * - Form input: `MM/dd/yyyy` (FormDateField)
 * - API: `YYYY-MM-DD` or RFC3339 (`2026-08-30T00:00:00Z`)
 */

const FORM_DATE_REGEX = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})/;

const LONG_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "long",
  year: "numeric",
};

let cachedLongFormatter: Intl.DateTimeFormat | null = null;
let cachedLongDateTimeFormatter: Intl.DateTimeFormat | null = null;

function getLongFormatter(): Intl.DateTimeFormat | null {
  if (cachedLongFormatter) return cachedLongFormatter;
  try {
    cachedLongFormatter = new Intl.DateTimeFormat("en-GB", LONG_DATE_FORMAT);
    return cachedLongFormatter;
  } catch {
    return null;
  }
}

function getLongDateTimeFormatter(): Intl.DateTimeFormat | null {
  if (cachedLongDateTimeFormatter) return cachedLongDateTimeFormatter;
  try {
    cachedLongDateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
      ...LONG_DATE_FORMAT,
      hour: "2-digit",
      minute: "2-digit",
    });
    return cachedLongDateTimeFormatter;
  } catch {
    return null;
  }
}

/**
 * Format a server date for display.
 * Examples:
 *   "2026-08-30T00:00:00Z" → "30 August 2026"
 *   "2026-08-31"           → "31 August 2026"
 *   "08/30/2026"           → "30 August 2026"
 *   ""                     → ""
 *
 * Never throws — falls back to the raw value on any error.
 */
export function formatLongDate(value: string | null | undefined): string {
  if (!value) return "";

  try {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      const fmt = getLongFormatter();
      if (fmt) return fmt.format(date);
    }

    // Fallback: try YYYY-MM-DD slice if `new Date` failed (e.g. bad TZ).
    const match = value.match(ISO_DATE_REGEX);
    if (match) {
      const dateOnly = new Date(
        `${match[1]}-${match[2]}-${match[3]}T00:00:00Z`,
      );
      if (!Number.isNaN(dateOnly.getTime())) {
        const fmt = getLongFormatter();
        if (fmt) return fmt.format(dateOnly);
      }
    }
  } catch {
    // Swallow any error and return the raw value below.
  }

  return value;
}

/** Format a server timestamp with both date and local time. */
export function formatLongDateTime(
  value: string | null | undefined,
): string {
  if (!value) return "";

  try {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      const formatter = getLongDateTimeFormatter();
      if (formatter) return formatter.format(date);
    }
  } catch {
    // Fall back to the unformatted server value.
  }

  return value;
}

/**
 * Convert any server-returned date string into the form display format
 * `MM/dd/yyyy`. Pass-through if already in form format.
 */
export function toFormDate(value: string | null | undefined): string {
  if (!value) return "";

  // Already in form format.
  if (FORM_DATE_REGEX.test(value)) return value;

  // ISO date or RFC3339 — parse with Date and reformat.
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = String(date.getFullYear());
    return `${month}/${day}/${year}`;
  }

  // Fallback: try YYYY-MM-DD slice.
  const match = value.match(ISO_DATE_REGEX);
  if (match) {
    return `${match[2]}/${match[3]}/${match[1]}`;
  }

  return value;
}

/**
 * Convert form display format `MM/dd/yyyy` to API format `YYYY-MM-DD`.
 * Returns `undefined` for empty / unparseable input.
 */
export function toApiDate(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  // Already ISO / RFC3339 — pass through.
  if (ISO_DATE_REGEX.test(trimmed)) return trimmed.slice(0, 10);

  // MM/dd/yyyy → YYYY-MM-DD
  const match = trimmed.match(FORM_DATE_REGEX);
  if (match) return `${match[3]}-${match[1]}-${match[2]}`;

  return undefined;
}
