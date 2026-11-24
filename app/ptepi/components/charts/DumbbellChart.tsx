"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { formatPctPoints, formatPoints } from "../../format";
import type { DumbbellPoint } from "../../types";
import { AXIS_TICK, CHART_COLORS, GRID } from "./chartTheme";
import { ChartLegend } from "./ChartLegend";
import { formatPercentAxis } from "./formatters";
import { useChartAnimation } from "./useChartAnimation";

type DumbbellChartProps = {
  points: DumbbellPoint[];
};

const ROW_HEIGHT = 44;

type ProjectTickProps = {
  x?: number | string;
  y?: number | string;
  payload?: { value?: string | number };
};

/** Project id on the axis is a real link, so the chart can be used with the keyboard. */
function ProjectTick({ x = 0, y = 0, payload }: ProjectTickProps) {
  const id = String(payload?.value ?? "");
  return (
    <g transform={`translate(${x},${y})`}>
      <Link href={`/ptepi/project/${id}`} aria-label={`Open project ${id}`}>
        <text x={-6} y={0} dy={4} textAnchor="end" fontSize={12} className="fill-primary-700 hover:underline">
          {id}
        </text>
      </Link>
    </g>
  );
}

/** Plan against actual per project: grey dot for plan, primary dot for actual, red bar for the gap. */
export function DumbbellChart({ points }: DumbbellChartProps) {
  const router = useRouter();
  const animation = useChartAnimation();
  return (
    <div>
      <div style={{ height: points.length * ROW_HEIGHT + 40 }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} layout="vertical" margin={{ top: 4, right: 24, bottom: 0, left: 8 }}>
            <CartesianGrid horizontal={false} {...GRID} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tickLine={false}
              axisLine={false}
              tick={AXIS_TICK}
              tickFormatter={formatPercentAxis}
            />
            <YAxis
              type="category"
              dataKey="projectId"
              width={84}
              tickLine={false}
              axisLine={false}
              interval={0}
              tick={<ProjectTick />}
            />
            <Tooltip
              cursor={{ fill: "var(--color-primary-50)" }}
              content={({ active, payload }) => {
                const point = payload?.[0]?.payload as DumbbellPoint | undefined;
                if (!active || !point) return null;
                return (
                  <div className="rounded-lg border border-border bg-background p-3 text-xs shadow-md">
                    <p className="mb-1 font-semibold">
                      {point.projectId} ({point.customer})
                    </p>
                    <p className="tabular-nums">Plan {formatPctPoints(point.plan)}</p>
                    <p className="tabular-nums">Actual {formatPctPoints(point.actual)}</p>
                    <p className="tabular-nums font-semibold">{formatPoints(point.deviationPts)}</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="gapStart" stackId="gap" fill="transparent" stroke="none" {...animation} />
            <Bar
              dataKey="gapSize"
              stackId="gap"
              fill={CHART_COLORS.bad}
              fillOpacity={0.35}
              barSize={8}
              radius={4}
              style={{ cursor: "pointer" }}
              onClick={(_, index) => {
                const point = points[index];
                if (point) router.push(`/ptepi/project/${point.projectId}`);
              }}
              {...animation}
            />
            <Line
              dataKey="plan"
              stroke="none"
              dot={{ r: 6, fill: CHART_COLORS.plan, stroke: "var(--color-background)", strokeWidth: 2 }}
              activeDot={false}
              legendType="none"
              {...animation}
            />
            <Line
              dataKey="actual"
              stroke="none"
              dot={{ r: 6, fill: CHART_COLORS.actual, stroke: "var(--color-background)", strokeWidth: 2 }}
              activeDot={false}
              legendType="none"
              {...animation}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        items={[
          { label: "Plan", color: CHART_COLORS.plan, shape: "dot" },
          { label: "Actual", color: CHART_COLORS.actual, shape: "dot" },
          { label: "Gap to plan", color: CHART_COLORS.bad }
        ]}
      />
    </div>
  );
}
