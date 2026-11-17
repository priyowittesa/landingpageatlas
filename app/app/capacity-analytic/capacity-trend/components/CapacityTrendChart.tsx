import { TrendLegendItem, TrendPoint, TrendRefLine } from "../types";
import { formatNumber } from "../../api";

interface CapacityTrendChartProps {
  data: TrendPoint[];
  legend: TrendLegendItem[];
  refLines: TrendRefLine[];
  n1Color?: string;
  loadingColor?: string;
  chartMax?: number;
  chartHeight?: number;
}

export function CapacityTrendChart({
  data,
  legend,
  refLines,
  n1Color = "#A78BFA",
  loadingColor = "#3B0764",
  chartMax: requestedMax,
  chartHeight = 380,
}: CapacityTrendChartProps) {
  const shiftKeys = ["shift1", "shift2", "shift3"] as const;
  const values = data.flatMap((point) => [point.loading, point.n1, ...shiftKeys.map((key) => point[key])]).filter((value): value is number => value != null && Number.isFinite(value));
  const chartMax = requestedMax ?? Math.max(400, Math.ceil(Math.max(0, ...values, ...refLines.map((line) => line.pct)) / 50) * 50 + 50);
  const tickStep = 50;
  const ticks = Array.from(
    { length: chartMax / tickStep + 1 },
    (_, i) => i * tickStep,
  );

  return (
    <div className="min-w-0">
      {/* Legend */}
      <div className="flex flex-wrap justify-end gap-4">
        {legend.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className={item.label.startsWith("Capacity") ? "w-5 border-t-2 border-dashed" : "size-2.5 rounded-xs"} style={item.label.startsWith("Capacity") ? { borderColor: item.color } : { backgroundColor: item.color }} />
            <span className="text-xs text-neutral-500">{item.label}</span>
          </div>
        ))}
      </div>

      {!data.length && <p className="mt-4 text-sm text-muted-foreground">No capacity data for the selected filters.</p>}
      <div className="overflow-x-auto pt-6 pb-2">
      <div style={{ minWidth: Math.max(560, data.length * 80) }}>
      <div className="flex">
        {/* Left Y axis */}
        <div
          className="flex flex-col justify-between text-right pr-3 text-[11px] text-neutral-500 shrink-0"
          style={{ height: chartHeight }}
        >
          {[...ticks].reverse().map((t) => (
            <span key={t} className="leading-none -translate-y-1/2">
              {t}%
            </span>
          ))}
        </div>

        {/* Plot area */}
        <div className="relative flex-1" style={{ height: chartHeight }}>
          {/* grid lines */}
          {ticks.map((t) => (
            <div
              key={t}
              className="absolute left-0 right-0 border-t border-border"
              style={{ bottom: `${(t / chartMax) * 100}%` }}
            />
          ))}

          {/* reference lines */}
          {refLines.map((r) => (
            <div
              key={r.pct}
              className="absolute left-0 right-0"
              style={{ bottom: `${(r.pct / chartMax) * 100}%` }}
            >
              <div
                className="border-t"
                style={{
                  borderColor: r.color,
                  borderStyle: r.dashStyle,
                  borderWidth: r.dashStyle === "dotted" ? 2 : 1.5,
                }}
              />
              <span
                className="absolute left-2 -translate-y-full text-xs font-semibold"
                style={{ color: r.color }}
              >
                {r.label}
              </span>
            </div>
          ))}

          {/* bar groups */}
          <div className="relative h-full flex items-end justify-around">
            {data.map((point) => (
              <div key={point.month} className="flex h-full flex-1 items-end justify-center gap-3">
                {([{ value: point.n1, color: n1Color, label: "N-1" }, { value: point.loading, color: loadingColor, label: "Loading" }]).map(({ value, color, label }) => value == null || !Number.isFinite(value) ? null :
                  <div key={label} data-series={label} aria-label={`${point.month} ${label}: ${formatNumber(value, "%")}`} className="relative w-4 rounded-t-xs" style={{ height: `${Math.max(0, value) / chartMax * 100}%`, backgroundColor: color }}>
                    <span className="absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap bg-background/90 text-[10px] font-semibold">{formatNumber(value, "%")}</span>
                  </div>)}
              </div>
            ))}
          </div>
          <svg role="img" aria-label="Capacity shift simulations" className="pointer-events-none absolute inset-0 size-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            {shiftKeys.map((key, index) => {
              let previousKnown = false;
              // Start a new segment after missing months; never interpolate unavailable results.
              const path = data.map((point, monthIndex) => {
                const value = point[key];
                if (value == null || !Number.isFinite(value)) { previousKnown = false; return ""; }
                const command = previousKnown ? "L" : "M";
                previousKnown = true;
                return `${command}${(monthIndex + 0.5) / data.length * 100},${100 - value / chartMax * 100}`;
              }).join(" ");
              return <g key={key} data-series={`Capacity ${index + 1} Shift`}>
                <title>{`Capacity ${index + 1} Shift`}</title>
                <path d={path} fill="none" stroke={legend[index + 2]?.color} strokeWidth={2} strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />
                {data.map((point, monthIndex) => {
                  const value = point[key];
                  return value == null || !Number.isFinite(value) ? null : <circle key={point.month} cx={(monthIndex + 0.5) / data.length * 100} cy={100 - value / chartMax * 100} r={0.3} fill={legend[index + 2]?.color}><title>{`${point.month}: ${formatNumber(value, "%")}`}</title></circle>;
                })}
              </g>;
            })}
          </svg>
        </div>

        {/* Right Y axis */}
        <div
          className="flex flex-col justify-between text-left pl-3 text-[11px] text-neutral-500 shrink-0"
          style={{ height: chartHeight }}
        >
          {[...ticks].reverse().map((t) => (
            <span key={t} className="leading-none -translate-y-1/2">
              {t}%
            </span>
          ))}
        </div>
      </div>

      {/* x axis month labels */}
      <div className="flex">
        <div className="pr-3 w-[30px] shrink-0" />
        <div className="flex-1 flex items-center justify-around pt-2">
          {data.map((point) => (
            <span
              key={point.month}
              className="min-w-0 flex-1 text-center text-[13px] font-medium text-foreground"
            >
              {point.month}
            </span>
          ))}
        </div>
        <div className="pl-3 w-[30px] shrink-0" />
      </div>
      </div>
      </div>
    </div>
  );
}
