/** Shared chart formatters: Indonesian number style (dot thousands, comma decimals). */

const compactDecimals = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
const billionDecimals = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });

/** Rupiah for axes and tooltips: 239270000 -> "Rp 239,3 m", 1080000000 -> "Rp 1,08 bn". */
export function formatRupiahCompact(value: number): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${sign}Rp ${billionDecimals.format(abs / 1_000_000_000)} bn`;
  if (abs >= 1_000_000) return `${sign}Rp ${compactDecimals.format(abs / 1_000_000)} m`;
  if (abs >= 1_000) return `${sign}Rp ${compactDecimals.format(abs / 1_000)} k`;
  return `${sign}Rp ${compactDecimals.format(abs)}`;
}

/** A fraction as a percent: (0.28498, 1) -> "28,5%". */
export function formatPercentFromFraction(fraction: number, maxDigits = 1): string {
  const format = new Intl.NumberFormat("id-ID", { maximumFractionDigits: maxDigits });
  return `${format.format(fraction * 100)}%`;
}

/** A value already in percentage points as an axis tick: 73.487 -> "73%". */
export function formatPercentAxis(points: number): string {
  return `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(points)}%`;
}

/**
 * Round axis ticks from zero: the step is 1, 2, 2,5 or 5 x 10^n so there are about
 * four intervals, and the last tick is the max rounded up. 93 -> [0, 25, 50, 75, 100].
 */
export function niceTicks(max: number, intervals = 4): number[] {
  if (max <= 0) return [0, 1];
  const raw = max / intervals;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step =
    [1, 2, 2.5, 5, 10].map((factor) => factor * magnitude).find((candidate) => candidate >= raw) ??
    10 * magnitude;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let value = 0; value <= top + step / 2; value += step) ticks.push(Math.round(value * 1000) / 1000);
  return ticks;
}
