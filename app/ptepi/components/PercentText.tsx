import { cn } from "@/lib/utils";
import { formatPercent } from "../format";

type PercentTextProps = {
  /** A fraction: 0.5 renders as "50%". */
  fraction: number | null | undefined;
  /** Max decimals, 3 by default */
  digits?: 2 | 3;
  className?: string;
};

export function PercentText({ fraction, digits, className }: PercentTextProps) {
  if (fraction == null) return <span className={cn("tabular-nums", className)}>-</span>;
  return <span className={cn("tabular-nums", className)}>{formatPercent(fraction, digits)}</span>;
}
