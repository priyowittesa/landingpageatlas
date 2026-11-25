"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { formatPctPoints, formatPoints } from "../../format";
import type { DumbbellPoint } from "../../types";
import { chartMargin, useRootScale } from "../../use-root-scale";
import { useProjectPreview } from "../ProjectPreview";
import { Tr } from "../Tr";
import { AXIS_TICK, CHART_COLORS, GRID } from "./chartTheme";
import { ChartLegend } from "./ChartLegend";
import { formatPercentAxis } from "./formatters";
import { useChartAnimation } from "./useChartAnimation";

type PlanActualChartProps = {
  points: DumbbellPoint[];
};

const ROW_HEIGHT = 64;

type ProjectTickProps = {
  x?: number | string;
  y?: number | string;
  payload?: { value?: string | number };
};

/** Project id on the axis opens the project drawer; it is a real button for keyboard users. */
function ProjectTick({ x = 0, y = 0, payload }: ProjectTickProps) {
  const id = String(payload?.value ?? "");
  const scale = useRootScale();
  const preview = useProjectPreview();
  const open = () => preview.open(id, "Opened from the plan against actual chart");
  return (
    <g
      transform={`translate(${x},${y})`}
      role="button"
      tabIndex={0}
      aria-label={`Open project ${id}`}
      style={{ cursor: "pointer", outline: "none" }}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      }}
    >
      <text x={-6 * scale} y={0} dy={4 * scale} textAnchor="end" fontSize="0.8125rem" className="fill-primary-700 hover:underline">
        {id}
      </text>
    </g>
  );
}

/**
 * Plan against actual per project as two bars side by side: grey for the plan, violet for
 * the actual, each labelled with its value. The deviation is in the tooltip and the table.
 */
export function DumbbellChart({ points }: PlanActualChartProps) {
  const animation = useChartAnimation();
  const s = useRootScale();
  const preview = useProjectPreview();
  const openPoint = (point?: DumbbellPoint) => point && preview.open(point.projectId, "Opened from the plan against actual chart");
  return (
    <div>
      <div style={{ height: (points.length * ROW_HEIGHT + 40) * s }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={points}
            layout="vertical"
            barCategoryGap="22%"
            barGap={2 * s}
            margin={{ ...chartMargin(s), right: 48 * s }}
          >
            <CartesianGrid horizontal={false} {...GRID} />
            <XAxis
              type="number"
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickLine={false}
              axisLine={false}
              tick={AXIS_TICK}
              tickFormatter={formatPercentAxis}
            />
            <YAxis
              type="category"
              dataKey="projectId"
              width={84 * s}
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
                    <p className="tabular-nums"><Tr>Plan</Tr> {formatPctPoints(point.plan)}</p>
                    <p className="tabular-nums"><Tr>Actual</Tr> {formatPctPoints(point.actual)}</p>
                    <p className="tabular-nums font-semibold"><Tr>Deviation</Tr> <Tr>{formatPoints(point.deviationPts)}</Tr></p>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="plan"
              fill={CHART_COLORS.plan}
              fillOpacity={0.55}
              radius={[0, 4 * s, 4 * s, 0]}
              maxBarSize={14 * s}
              style={{ cursor: "pointer" }}
              onClick={(_, index) => openPoint(points[index])}
              {...animation}
            >
              <LabelList dataKey="plan" position="right" formatter={(value) => formatPctPoints(Number(value))} fontSize="0.75rem" fill="var(--color-muted-foreground)" />
            </Bar>
            <Bar
              dataKey="actual"
              fill={CHART_COLORS.actual}
              radius={[0, 4 * s, 4 * s, 0]}
              maxBarSize={14 * s}
              style={{ cursor: "pointer" }}
              onClick={(_, index) => openPoint(points[index])}
              {...animation}
            >
              <LabelList dataKey="actual" position="right" formatter={(value) => formatPctPoints(Number(value))} fontSize="0.75rem" fontWeight={600} fill="var(--color-primary-800)" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        items={[
          { label: "Plan", color: CHART_COLORS.plan },
          { label: "Actual", color: CHART_COLORS.actual }
        ]}
      />
    </div>
  );
}
