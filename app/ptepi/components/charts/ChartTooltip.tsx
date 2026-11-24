import type { ReactNode } from "react";

type TooltipEntry = {
  name?: unknown;
  value?: unknown;
  color?: string;
  dataKey?: unknown;
};

type ChartTooltipProps = {
  active?: boolean;
  label?: unknown;
  payload?: readonly TooltipEntry[];
  /** Formats one value; the default prints numbers as they are */
  formatValue?: (value: number, entry: TooltipEntry) => string;
  /** Formats the heading, for example a week label */
  formatLabel?: (label: unknown) => ReactNode;
  /** Series that should not appear, such as invisible base bars */
  hideKeys?: readonly string[];
};

/** One tooltip for every chart: same look as the app cards, values via the shared formatters. */
export function ChartTooltip({
  active,
  label,
  payload,
  formatValue = (value) => String(value),
  formatLabel,
  hideKeys = []
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const entries = payload.filter(
    (entry) => typeof entry.value === "number" && !hideKeys.includes(String(entry.dataKey))
  );
  if (entries.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-background p-3 text-xs shadow-md">
      {label !== undefined && label !== "" && (
        <p className="mb-1.5 font-semibold text-foreground">
          {formatLabel ? formatLabel(label) : String(label)}
        </p>
      )}
      <ul className="space-y-1">
        {entries.map((entry) => (
          <li key={String(entry.dataKey)} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                aria-hidden
                className="h-2 w-2 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              {String(entry.name ?? entry.dataKey)}
            </span>
            <span className="font-semibold tabular-nums text-foreground">
              {formatValue(entry.value as number, entry)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
