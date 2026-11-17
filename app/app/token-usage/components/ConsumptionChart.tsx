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
import { Spinner } from "@/components/ui/spinner";
import { formatTokens } from "../lib/format";
import type { TokenConsumptionSeries } from "../types";

const BAR_COLOR = "var(--atlas-primary-500)";
const BAR_HOVER_COLOR = "var(--atlas-primary-600)";
const AVERAGE_COLOR = "var(--atlas-primary-300)";

/**
 * The "Consumption" chart: one bar per bucket with a dashed daily-average
 * reference line, matching the design's bar chart + legend.
 */
export function ConsumptionChart({
  series,
  isLoading = false,
  height = 200
}: {
  series: TokenConsumptionSeries | undefined;
  isLoading?: boolean;
  height?: number;
}) {
  if (isLoading || !series) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ height }}
        aria-busy="true"
      >
        <Spinner className="size-6 text-primary" />
      </div>
    );
  }

  const averageLabel =
    series.granularity === "daily" ? "Daily average" : "Period average";

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={series.points}
          margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
          barCategoryGap="24%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f0f0f0"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => formatTokens(Number(value))}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 11
            }}
            formatter={(value) => [formatTokens(Number(value)), "Token used"]}
          />
          <ReferenceLine
            y={series.average}
            stroke={AVERAGE_COLOR}
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{
              value: `Average ${formatTokens(series.average)}`,
              position: "right",
              fill: AVERAGE_COLOR,
              fontSize: 10
            }}
          />
          <Bar
            dataKey="tokens"
            fill={BAR_COLOR}
            radius={[4, 4, 0, 0]}
            activeBar={<Cell fill={BAR_HOVER_COLOR} />}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 flex items-center gap-6">
        <span className="inline-flex items-center gap-2 text-xs text-gray-600">
          <span
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: BAR_COLOR }}
          />
          Token used
        </span>
        <span className="inline-flex items-center gap-2 text-xs text-gray-600">
          <span
            className="h-0 w-5 border-t-2 border-dashed"
            style={{ borderColor: AVERAGE_COLOR }}
          />
          {averageLabel}
        </span>
      </div>
    </div>
  );
}
