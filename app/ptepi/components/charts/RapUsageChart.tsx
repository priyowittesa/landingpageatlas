"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { formatPercent, formatRupiahMillions } from "../../format";
import type { CostUsagePoint } from "../../types";
import { AXIS_TICK, CHART_COLORS, GRID } from "./chartTheme";
import { CategoryTick } from "./CategoryTick";
import { ChartLegend } from "./ChartLegend";
import { formatPercentAxis, niceTicks } from "./formatters";
import { useChartAnimation } from "./useChartAnimation";
import { chartMargin, useRootScale } from "../../use-root-scale";

const ROW_HEIGHT = 40;
const LABEL_WIDTH = 190;

/**
 * Share of each RAP category already used (0-100%, marker at 100%). Shares keep small
 * categories readable; only a category over its RAP turns red. Rp amounts are in the tooltip.
 */
export function RapUsageChart({ points }: { points: CostUsagePoint[] }) {
  const animation = useChartAnimation();
  const s = useRootScale();
  const ticks = niceTicks(Math.max(100, ...points.map((point) => point.usedPct)));
  return (
    <div>
      <div style={{ height: (points.length * ROW_HEIGHT + 40) * s }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points} layout="vertical" margin={chartMargin(s)}>
            <CartesianGrid horizontal={false} {...GRID} />
            <XAxis
              type="number"
              domain={[0, ticks[ticks.length - 1] ?? 100]}
              ticks={ticks}
              tickLine={false}
              axisLine={false}
              tick={AXIS_TICK}
              tickFormatter={formatPercentAxis}
            />
            <YAxis
              type="category"
              dataKey="category"
              width={LABEL_WIDTH * s}
              tickLine={false}
              axisLine={false}
              interval={0}
              tick={<CategoryTick />}
            />
            <ReferenceLine x={100} stroke={CHART_COLORS.plan} strokeDasharray="4 3" />
            <Tooltip
              cursor={{ fill: "var(--color-primary-50)" }}
              content={({ active, payload }) => {
                const point = payload?.[0]?.payload as CostUsagePoint | undefined;
                if (!active || !point) return null;
                return (
                  <div className="rounded-lg border border-border bg-background p-3 text-xs shadow-md">
                    <p className="mb-1 font-semibold">{point.category}</p>
                    <p className="tabular-nums">RAP budget {formatRupiahMillions(point.rapPlanned)}</p>
                    <p className="tabular-nums">Realised cost {formatRupiahMillions(point.cost)}</p>
                    <p className="tabular-nums font-semibold">
                      {point.rapPlanned > 0 ? `${formatPercent(point.usedPct / 100, 2)} of RAP used` : "No RAP budget"}
                      {point.over ? ", over RAP" : ""}
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="usedPct" maxBarSize={20 * s} radius={4} {...animation}>
              {points.map((point) => (
                <Cell key={point.category} fill={point.over ? CHART_COLORS.bad : CHART_COLORS.actual} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        items={[
          { label: "RAP used", color: CHART_COLORS.actual },
          { label: "Over RAP", color: CHART_COLORS.bad },
          { label: "100% of RAP (dashed line)", color: CHART_COLORS.plan }
        ]}
      />
    </div>
  );
}
