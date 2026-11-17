import { cn } from "@/lib/utils";
import { ChartGroup, LegendItem, RefLine } from "../types";

interface Chart {
  groups: ChartGroup[];
  legend: LegendItem[];
  refLines: RefLine[];
  chartMax?: number;
  chartHeight?: number;
}

export function LoadingCapacityChart({
  groups,
  legend,
  refLines,
  chartMax: requestedMax,
  chartHeight = 380,
}: Chart) {
  const chartMax = requestedMax ?? Math.max(400, Math.ceil(Math.max(0, ...groups.flatMap((g) => g.bars.map((b) => b.value)), ...refLines.map((r) => r.pct)) / 50) * 50 + 50);
  const tickStep = 50;
  const ticks = Array.from(
    { length: chartMax / tickStep + 1 },
    (_, i) => i * tickStep,
  );

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-border px-5 py-5">
        {!groups.length && <p className="text-sm text-muted-foreground">No capacity data for the selected filters.</p>}
        <div style={{ minWidth: Math.max(500, groups.length * 210) }}>
        <div className="flex">
          {/* Y axis labels */}
          <div
            className="flex flex-col justify-between text-right text-[11px] text-neutral-500 shrink-0"
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
                className="absolute left-0 right-0 h-px"
                style={{
                  bottom: `${(r.pct / chartMax) * 100}%`,
                  backgroundColor: r.color,
                }}
              />
            ))}

            {/* bar groups */}
            <div className="relative h-full flex items-end justify-around">
              {groups.map((group) => (
                <div
                  key={group.line}
                  className={cn(
                    `flex items-end gap-1.5 h-full`,
                    group.highlighted ? "bg-primary/10 rounded-t-lg px-3" : "",
                  )}
                >
                  {group.bars.map((bar) => (
                    <div
                      key={bar.label}
                      className="relative flex flex-col items-center justify-end h-full w-6 px-1.5"
                    >
                      <span className="mb-1 text-[10px] font-medium text-foreground whitespace-nowrap">
                        {bar.value}%
                      </span>
                      <div
                        className="w-full rounded-t-xs"
                        style={{
                          height: `${(bar.value / chartMax) * 100}%`,
                          backgroundColor: bar.color,
                        }}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* x axis group labels */}
        <div className="flex pl-8">
          <div className="flex-1 flex items-center justify-around pt-2">
            {groups.map((group) => (
              <span
                key={group.line}
                className="text-[11px] font-semibold text-gray-700"
              >
                {group.line}
              </span>
            ))}
          </div>
        </div>
        </div>
      </div>

      {/* legend */}
      <div className="flex flex-wrap gap-4 pt-7">
        {legend.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-xs"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-neutral-500">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
