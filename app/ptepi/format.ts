/** Pure formatters (Indonesian number style: dot thousands, comma decimals). */

const integerFormat = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0
});
const oneDecimalFormat = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
});
const percentFormat = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3
});

/** 1234567 -> "Rp 1.234.567" */
export function formatRupiah(value: number): string {
  const sign = value < 0 ? "-" : "";
  return `${sign}Rp ${integerFormat.format(Math.abs(Math.round(value)))}`;
}

/** 6683144041 -> "Rp 6.683,1 m"; 0 -> "Rp 0" */
export function formatRupiahMillions(value: number): string {
  if (value === 0) return "Rp 0";
  const sign = value < 0 ? "-" : "";
  return `${sign}Rp ${oneDecimalFormat.format(Math.abs(value) / 1_000_000)} m`;
}

const percentTwoFormat = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

/** Fraction to percent: 0.73487 -> "73,487%", 1 -> "100%". Pass 2 for "22,26%". */
const percentOneFormat = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
});

export function formatPercent(fraction: number, maxDigits: 1 | 2 | 3 = 3): string {
  const format = maxDigits === 1 ? percentOneFormat : maxDigits === 2 ? percentTwoFormat : percentFormat;
  return `${format.format(fraction * 100)}%`;
}

/** Value already in percentage points: 73.487 -> "73,487%". */
export function formatPctPoints(points: number): string {
  return `${percentFormat.format(points)}%`;
}

/** Fixed decimals with a decimal comma: (8.9378, 1) -> "8,9". */
export function formatDecimal(value: number, digits: number): string {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
}

/** Percentage points without sign: 32.058 -> "32,058 pts". */
export function formatPointsUnsigned(points: number): string {
  return `${percentFormat.format(points)} pts`;
}

/** Percentage points with sign: -44.989 -> "-44,989 pts". */
export function formatPoints(points: number): string {
  const sign = points < 0 ? "-" : points > 0 ? "+" : "";
  return `${sign}${percentFormat.format(Math.abs(points))} pts`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-11-08" -> "8 Nov 2026". Anything that is not an ISO date is returned unchanged. */
export function formatDateLabel(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  const month = match ? MONTHS[Number(match[2]) - 1] : undefined;
  return match && month ? `${Number(match[3])} ${month} ${match[1]}` : isoDate;
}

/** One wording for a run of weeks: (14, 18) -> "weeks 14 to 18 (5 weeks)". */
export function formatWeekRange(fromWeek: number, toWeek: number): string {
  const weeks = toWeek - fromWeek + 1;
  return fromWeek === toWeek
    ? `week ${fromWeek} (1 week)`
    : `weeks ${fromWeek} to ${toWeek} (${weeks} weeks)`;
}

/** Points per week; a flat pace reads "0 pts", never "0,0". */
export function formatPace(pointsPerWeek: number): string {
  return pointsPerWeek === 0 ? "0 pts" : `${formatDecimal(pointsPerWeek, 1)} pts`;
}

/** The one date format of the prototype: "2026-11-15" -> "15 Nov 2026"; null -> "-". */
export function formatDate(isoDate: string | null | undefined): string {
  return isoDate ? formatDateLabel(isoDate) : "-";
}

/** A date range: "7 Jul 2026 to 2 Jan 2027". */
export function formatDateRange(from: string | null | undefined, to: string | null | undefined): string {
  return `${formatDate(from)} to ${formatDate(to)}`;
}
