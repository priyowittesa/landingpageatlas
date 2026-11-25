"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { ChartTooltip } from "./ChartTooltip";
import { formatPercentAxis } from "./formatters";
import { useChartAnimation } from "./useChartAnimation";
import { chartMargin, useRootScale } from "../../use-root-scale";
import { useT } from "../Tr";

type SCurveChartProps = {
  points: SCurveChartPoint[];
  todayLabel: string | null;
  requiredPace: number | null;
  /** Pace of the ATLAS-estimated forecast: best 4-week rolling average */
  forecastPace?: number | null;
};

const SERIES_LABELS = {
  plan: "Plan",
  actual: "Actual",
  pace: "Required pace",
  gap: "Gap to plan",
  forecast: "Scenario if best pace repeats (ATLAS-estimated)"
};

/**
 * Plan (grey, dashed) against actual (primary), the gap to plan up to today shaded,
 * a today marker and the pace needed to finish on the planned date.
 */
export function SCurveChart({ points, todayLabel, requiredPace, forecastPace = null }: SCurveChartProps) {
  const animation = useChartAnimation();
  const s = useRootScale();
  const t = useT();
  // Series the reader switched off with the chips under the chart.
  const [hidden, setHidden] = useState<string[]>([]);
  const off = (key: string) => hidden.includes(key);
  const toggle = (key: string) => setHidden((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  const chips: { key: string; label: string; color: string; dashed?: boolean }[] = [
    { key: "plan", label: SERIES_LABELS.plan, color: CHART_COLORS.plan, dashed: true },
    { key: "actual", label: SERIES_LABELS.actual, color: CHART_COLORS.actual },
    { key: "gap", label: SERIES_LABELS.gap, color: CHART_COLORS.bad },
    ...(requiredPace === null ? [] : [{ key: "pace", label: `${SERIES_LABELS.pace}: ${formatDecimal(requiredPace, 1)} pts per week`, color: CHART_COLORS.pace, dashed: true }]),
    ...(forecastPace === null ? [] : [{ key: "forecast", label: `${SERIES_LABELS.forecast}: ${formatDecimal(forecastPace, 1)} pts per week`, color: CHART_COLORS.primaryLight, dashed: true }])
  ];
  return (
    <div>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={chartMargin(s, { top: 8, right: 16, bottom: 0, left: 0 })}>
            <defs>
              <linearGradient id="ptepi-gap" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.bad} stopOpacity={0.32} />
                <stop offset="100%" stopColor={CHART_COLORS.bad} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} {...GRID} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} interval={1} tick={{ ...AXIS_TICK, fontSize: "0.6875rem" }} />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              width={48 * s}
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
            <Area dataKey="gapBase" stackId="gap" stroke="none" fill="transparent" activeDot={false} legendType="none" hide={off("gap")} {...animation} />
            <Area
              dataKey="gap"
              name={t(SERIES_LABELS.gap)}
              stackId="gap"
              stroke="none"
              fill="url(#ptepi-gap)"
              activeDot={false}
              hide={off("gap")}
              {...animation}
            />
            {todayLabel && (
              <ReferenceLine
                x={todayLabel}
                stroke={CHART_COLORS.actual}
                strokeDasharray="2 4"
                label={{ value: t("Today"), position: "insideTopLeft", fill: "var(--color-primary-700)", fontSize: "0.6875rem" }}
              />
            )}
            <Line
              dataKey="pace"
              name={t(SERIES_LABELS.pace)}
              stroke={CHART_COLORS.pace}
              strokeWidth={2.5}
              strokeDasharray="1 5"
              strokeLinecap="round"
              hide={off("pace")}
              dot={false}
              connectNulls={false}
              {...animation}
            />
            <Line
              dataKey="forecast"
              name={t(SERIES_LABELS.forecast)}
              stroke={CHART_COLORS.primaryLight}
              strokeWidth={2.5}
              strokeDasharray="8 5"
              hide={off("forecast")}
              dot={false}
              connectNulls={false}
              {...animation}
            />
            <Line
              dataKey="plan"
              name={t(SERIES_LABELS.plan)}
              stroke={CHART_COLORS.plan}
              strokeWidth={2}
              strokeDasharray="6 4"
              hide={off("plan")}
              dot={false}
              {...animation}
            />
            <Line
              dataKey="actual"
              name={t(SERIES_LABELS.actual)}
              stroke={CHART_COLORS.actual}
              strokeWidth={3}
              dot={{ r: 2 }}
              hide={off("actual")}
              connectNulls={false}
              {...animation}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-3 flex flex-wrap items-center gap-2" aria-label={t("Show or hide a line")}>
        {chips.map((chip) => {
          const active = !off(chip.key);
          return (
            <li key={chip.key}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => toggle(chip.key)}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400",
                  active ? "border-primary-300 bg-primary-50 text-primary-950" : "border-border bg-background text-gray-600 line-through decoration-gray-400 hover:bg-primary-50/50"
                )}
              >
                {chip.dashed ? (
                  <svg width="18" height="8" aria-hidden>
                    <line x1="0" y1="4" x2="18" y2="4" stroke={chip.color} strokeWidth="2" strokeDasharray="4 3" />
                  </svg>
                ) : (
                  <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chip.color }} />
                )}
                {t(chip.label)}
                {active && <Check size={12} aria-hidden className="text-primary-700" />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
