"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { formatDecimal, formatPctPoints } from "../../format";
import type { SCurveChartPoint } from "../../types";
import { AXIS_TICK, CHART_COLORS, GRID } from "./chartTheme";
import { ChartLegend } from "./ChartLegend";
import { ChartTooltip } from "./ChartTooltip";
import { formatPercentAxis } from "./formatters";
import { useChartAnimation } from "./useChartAnimation";

type SCurveChartProps = {
  points: SCurveChartPoint[];
  todayLabel: string | null;
  requiredPace: number | null;
};

const SERIES_LABELS = { plan: "Plan", actual: "Actual", pace: "Required pace", gap: "Gap to plan" };

/**
 * Plan (grey, dashed) against actual (primary), the gap to plan up to today shaded,
 * a today marker and the pace needed to finish on the planned date.
 */
export function SCurveChart({ points, todayLabel, requiredPace }: SCurveChartProps) {
  const animation = useChartAnimation();
  return (
    <div>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="ptepi-gap" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.bad} stopOpacity={0.32} />
                <stop offset="100%" stopColor={CHART_COLORS.bad} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} {...GRID} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} interval={1} tick={{ ...AXIS_TICK, fontSize: 11 }} />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              width={48}
              tickLine={false}
              axisLine={false}
              tick={AXIS_TICK}
              tickFormatter={formatPercentAxis}
            />
            <Tooltip
              content={({ active, payload, label }) => (
                <ChartTooltip
                  active={active}
                  payload={payload}
                  label={label}
                  formatValue={formatPctPoints}
                  hideKeys={["gapBase"]}
                />
              )}
            />
            <Area dataKey="gapBase" stackId="gap" stroke="none" fill="transparent" activeDot={false} legendType="none" {...animation} />
            <Area
              dataKey="gap"
              name={SERIES_LABELS.gap}
              stackId="gap"
              stroke="none"
              fill="url(#ptepi-gap)"
              activeDot={false}
              {...animation}
            />
            {todayLabel && (
              <ReferenceLine
                x={todayLabel}
                stroke={CHART_COLORS.actual}
                strokeDasharray="2 4"
                label={{ value: "Today", position: "insideTopLeft", fill: "var(--color-primary-700)", fontSize: 11 }}
              />
            )}
            <Line
              dataKey="pace"
              name={SERIES_LABELS.pace}
              stroke={CHART_COLORS.pace}
              strokeWidth={2.5}
              strokeDasharray="1 5"
              strokeLinecap="round"
              dot={false}
              connectNulls={false}
              {...animation}
            />
            <Line
              dataKey="plan"
              name={SERIES_LABELS.plan}
              stroke={CHART_COLORS.plan}
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              {...animation}
            />
            <Line
              dataKey="actual"
              name={SERIES_LABELS.actual}
              stroke={CHART_COLORS.actual}
              strokeWidth={3}
              dot={{ r: 2 }}
              connectNulls={false}
              {...animation}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        items={[
          { label: SERIES_LABELS.plan, color: CHART_COLORS.plan, shape: "dash" },
          { label: SERIES_LABELS.actual, color: CHART_COLORS.actual },
          { label: SERIES_LABELS.gap, color: CHART_COLORS.bad },
          ...(requiredPace === null
            ? []
            : [{ label: `${SERIES_LABELS.pace}: ${formatDecimal(requiredPace, 1)} pts per week`, color: CHART_COLORS.pace, shape: "dash" as const }])
        ]}
      />
    </div>
  );
}
