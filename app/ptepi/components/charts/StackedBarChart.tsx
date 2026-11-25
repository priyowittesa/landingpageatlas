"use client";

import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { AXIS_TICK, GRID } from "./chartTheme";
import { rupiahAxisFormatter } from "./formatters";
import { CategoryTick } from "./CategoryTick";
import { ChartLegend } from "./ChartLegend";
import { ChartTooltip } from "./ChartTooltip";
import { useChartAnimation } from "./useChartAnimation";
import { chartMargin, useRootScale } from "../../use-root-scale";

export type BarSeries<T> = {
  key: keyof T & string;
  name: string;
  color: string;
};

type StackedBarChartProps<T extends object> = {
  data: T[];
  categoryKey: keyof T & string;
  series: BarSeries<T>[];
  /** bars: horizontal bars with names on the left; columns: vertical columns */
  orientation: "bars" | "columns";
  formatValue: (value: number) => string;
  formatTick?: (value: number) => string;
  /** Colour per datum for a single series, such as status buckets */
  colorOf?: (datum: T) => string;
  /** Series drawn but left out of the tooltip and the legend */
  hiddenKeys?: readonly string[];
  /** Replaces the default tooltip body */
  renderTooltip?: (datum: T) => ReactNode;
  labelWidth?: number;
  rowHeight?: number;
  height?: number;
  allowDecimals?: boolean;
  /** Columns: show every Nth category label (0 shows all) */
  tickInterval?: number;
  /** Turn the legend off when the colours carry no separate meaning */
  showLegend?: boolean;
  /** Fixed value-axis ticks, e.g. from niceTicks(); the axis ends at the last one */
  valueTicks?: number[];
  /** Money axis: one Rupiah unit (m or bn) for every tick, chosen from the largest stack */
  moneyAxis?: boolean;
};

/** One stacked bar chart for every screen. The value axis always starts at zero. */
export function StackedBarChart<T extends object>({
  data,
  categoryKey,
  series,
  orientation,
  formatValue,
  formatTick = formatValue,
  colorOf,
  hiddenKeys = [],
  renderTooltip,
  labelWidth = 150,
  rowHeight = 44,
  height,
  allowDecimals = true,
  showLegend = true,
  tickInterval = 0,
  valueTicks,
  moneyAxis = false
}: StackedBarChartProps<T>) {
  const stackMax = Math.max(
    0,
    ...data.map((datum) =>
      series.reduce((total, item) => total + (Number((datum as Record<string, unknown>)[item.key]) || 0), 0)
    )
  );
  const tickFormat = moneyAxis ? rupiahAxisFormatter(stackMax) : formatTick;
  const valueDomain: [number, number | "dataMax"] = valueTicks
    ? [0, valueTicks[valueTicks.length - 1] ?? 0]
    : [0, "dataMax"];
  const animation = useChartAnimation();
  const s = useRootScale();
  const bars = orientation === "bars";
  const chartHeight = (height ?? (bars ? data.length * rowHeight + 40 : 280)) * s;
  const visibleSeries = series.filter((item) => !hiddenKeys.includes(item.key));

  return (
    <div>
      <div style={{ height: chartHeight }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout={bars ? "vertical" : "horizontal"}
            margin={chartMargin(s)}
          >
            <CartesianGrid vertical={!bars} horizontal={bars ? false : true} {...GRID} />
            {bars ? (
              <>
                <XAxis
                  type="number"
                  domain={valueDomain}
                  ticks={valueTicks}
                  allowDecimals={allowDecimals}
                  tickCount={valueTicks ? undefined : 4}
                  tickLine={false}
                  axisLine={false}
                  tick={AXIS_TICK}
                  tickFormatter={tickFormat}
                />
                <YAxis
                  type="category"
                  dataKey={categoryKey as never}
                  width={labelWidth * s}
                  tickLine={false}
                  axisLine={false}
                  tick={<CategoryTick />}
                  interval={0}
                />
              </>
            ) : (
              <>
                <XAxis
                  type="category"
                  dataKey={categoryKey as never}
                  tickLine={false}
                  axisLine={false}
                  tick={AXIS_TICK}
                  interval={tickInterval}
                />
                <YAxis
                  type="number"
                  domain={valueDomain}
                  ticks={valueTicks}
                  allowDecimals={allowDecimals}
                  width={88 * s}
                  tickLine={false}
                  axisLine={false}
                  tick={AXIS_TICK}
                  tickFormatter={tickFormat}
                />
              </>
            )}
            <Tooltip
              cursor={{ fill: "var(--color-primary-50)" }}
              content={({ active, payload, label }) => {
                if (renderTooltip) {
                  const datum = payload?.[0]?.payload as T | undefined;
                  if (!active || !datum) return null;
                  return (
                    <div className="rounded-lg border border-border bg-background p-3 text-xs shadow-md">
                      {renderTooltip(datum)}
                    </div>
                  );
                }
                return (
                  <ChartTooltip
                    active={active}
                    payload={payload}
                    label={label}
                    formatValue={formatValue}
                    hideKeys={hiddenKeys}
                  />
                );
              }}
            />
            {series.map((item, index) => (
              <Bar
                key={item.key}
                dataKey={item.key as never}
                name={item.name}
                stackId="stack"
                fill={item.color}
                maxBarSize={bars ? 22 : 64}
                radius={index === series.length - 1 ? (bars ? [0, 6, 6, 0] : [6, 6, 0, 0]) : 0}
                {...animation}
              >
                {colorOf && index === 0
                  ? data.map((datum, row) => <Cell key={row} fill={colorOf(datum)} />)
                  : null}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      {showLegend && (
        <ChartLegend items={visibleSeries.map((item) => ({ label: item.name, color: item.color }))} />
      )}
    </div>
  );
}
