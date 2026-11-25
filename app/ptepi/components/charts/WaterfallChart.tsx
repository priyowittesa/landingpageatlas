"use client";
import { Tr } from "../Tr";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatRupiahMillions } from "../../format";
import type { WaterfallStep } from "../../types";
import { AXIS_TICK, CHART_COLORS, GRID } from "./chartTheme";
import { CategoryTick } from "./CategoryTick";
import { ChartLegend } from "./ChartLegend";
import { rupiahAxisFormatter } from "./formatters";
import { useChartAnimation } from "./useChartAnimation";

type WaterfallChartProps = {
  steps: WaterfallStep[];
  /** Height in px; grows with the number of steps by default */
  height?: number;
};

const ROW_HEIGHT = 40;

function signed(step: WaterfallStep): string {
  if (step.kind === "total") return formatRupiahMillions(step.value);
  return step.value > 0 ? `+${formatRupiahMillions(step.value)}` : formatRupiahMillions(step.value);
}

/** Floating-bar waterfall, drawn sideways so long step names stay readable. Axis starts at zero. */
export function WaterfallChart({ steps, height }: WaterfallChartProps) {
  const animation = useChartAnimation();
  return (
    <div>
      <div style={{ height: height ?? steps.length * ROW_HEIGHT + 40 }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={steps} layout="vertical" margin={{ top: 4, right: 24, bottom: 0, left: 8 }}>
            <CartesianGrid horizontal={false} {...GRID} />
            <XAxis
              type="number"
              domain={[0, "dataMax"]}
              tickLine={false}
              axisLine={false}
              tick={AXIS_TICK}
              tickFormatter={rupiahAxisFormatter(Math.max(0, ...steps.map((step) => step.base + step.size)))}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={190}
              tickLine={false}
              axisLine={false}
              tick={<CategoryTick />}
              interval={0}
            />
            <Tooltip
              cursor={{ fill: "var(--color-primary-50)" }}
              content={({ active, payload }) => {
                const step = payload?.[0]?.payload as WaterfallStep | undefined;
                if (!active || !step) return null;
                return (
                  <div className="rounded-lg border border-border bg-background p-3 text-xs shadow-md">
                    <p className="mb-1 font-semibold"><Tr>{step.label}</Tr></p>
                    <p className="tabular-nums">{signed(step)}</p>
                    {step.kind === "delta" && (
                      <p className="tabular-nums text-muted-foreground">
                        Level after: {formatRupiahMillions(step.end)}
                      </p>
                    )}
                  </div>
                );
              }}
            />
            <Bar dataKey="base" stackId="wf" fill="transparent" stroke="none" {...animation} />
            <Bar dataKey="size" stackId="wf" maxBarSize={22} radius={4} {...animation}>
              {steps.map((step) => (
                <Cell
                  key={step.label}
                  fill={step.kind === "total" ? CHART_COLORS.actual : CHART_COLORS.primaryLight}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        items={[
          { label: "Level", color: CHART_COLORS.actual },
          { label: "Change between levels", color: CHART_COLORS.primaryLight }
        ]}
      />
    </div>
  );
}
