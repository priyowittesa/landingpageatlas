"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatPercent, formatRupiahMillions } from "../../format";
import type { CostCategoryPoint } from "../../types";
import { AXIS_TICK, CHART_COLORS, GRID } from "./chartTheme";
import { ChartLegend } from "./ChartLegend";
import { formatRupiahCompact } from "./formatters";
import { useChartAnimation } from "./useChartAnimation";

type BulletChartProps = {
  points: CostCategoryPoint[];
};

const ROW_HEIGHT = 46;

/** Bullet bars: the wide light bar is the RAP budget, the narrow dark bar is realised cost. Axis from zero. */
export function BulletChart({ points }: BulletChartProps) {
  const animation = useChartAnimation();
  return (
    <div>
      <div style={{ height: points.length * ROW_HEIGHT + 40 }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points} layout="vertical" margin={{ top: 4, right: 24, bottom: 0, left: 8 }}>
            <CartesianGrid horizontal={false} {...GRID} />
            <XAxis
              type="number"
              domain={[0, "dataMax"]}
              tickLine={false}
              axisLine={false}
              tick={AXIS_TICK}
              tickFormatter={formatRupiahCompact}
            />
            <YAxis
              yAxisId="rap"
              type="category"
              dataKey="category"
              width={196}
              tickLine={false}
              axisLine={false}
              tick={AXIS_TICK}
              interval={0}
            />
            <YAxis yAxisId="cost" type="category" dataKey="category" hide />
            <Tooltip
              cursor={{ fill: "var(--color-primary-50)" }}
              content={({ active, payload }) => {
                const point = payload?.[0]?.payload as CostCategoryPoint | undefined;
                if (!active || !point) return null;
                return (
                  <div className="rounded-lg border border-border bg-background p-3 text-xs shadow-md">
                    <p className="mb-1 font-semibold">{point.category}</p>
                    <p className="tabular-nums">RAP budget {formatRupiahMillions(point.rapPlanned)}</p>
                    <p className="tabular-nums">Realised cost {formatRupiahMillions(point.cost)}</p>
                    {point.rapPlanned > 0 && (
                      <p className="tabular-nums font-semibold">
                        {formatPercent(point.cost / point.rapPlanned, 2)} of RAP used
                      </p>
                    )}
                  </div>
                );
              }}
            />
            <Bar yAxisId="rap" dataKey="rapPlanned" name="RAP budget" fill={CHART_COLORS.primaryLight} barSize={26} radius={6} {...animation} />
            <Bar yAxisId="cost" dataKey="cost" name="Realised cost" barSize={10} {...animation}>
              {points.map((point) => (
                <Cell key={point.category} fill={point.cost > point.rapPlanned ? CHART_COLORS.bad : CHART_COLORS.actual} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        items={[
          { label: "RAP budget", color: CHART_COLORS.primaryLight },
          { label: "Realised cost", color: CHART_COLORS.actual },
          { label: "Cost over RAP", color: CHART_COLORS.bad }
        ]}
      />
    </div>
  );
}
