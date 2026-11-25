"use client";
import { Tr } from "../Tr";

import type { ReactNode } from "react";
import {
  formatDecimal,
  formatPercent,
  formatPoints,
  formatPointsUnsigned,
  formatRupiahMillions
} from "../../format";
import type {
  CostChartData,
  CoverageChartData,
  DeficitChartData,
  DumbbellChartData,
  EarningStageChartData,
  IncrementPoint,
  DeficitPoint,
  SCurveChartData,
  ValueByStatusChartData,
  RetentionAgeingChartData,
  WaterfallChartData,
  WeeklyIncrementChartData
} from "../../types";
import type {
  ActionChartData,
  AgingBucket,
  OwnerStatusPoint
} from "../../store/action-helpers";
import { RapUsageChart } from "./RapUsageChart";
import { CHART_COLORS } from "./chartTheme";
import { ChartCard } from "./ChartCard";
import { DumbbellChart } from "./DumbbellChart";
import { niceTicks } from "./formatters";
import { SCurveChart } from "./SCurveChart";
import { StackedBarChart } from "./StackedBarChart";
import { WaterfallChart } from "./WaterfallChart";

/**
 * One card per chart of the prototype. They live in one client file because
 * the formatters are functions, which a server page cannot pass as props.
 */

type CardProps<T> = { chart: T; badge?: ReactNode; className?: string };

export function ValueByStatusCard({ chart, badge, className }: CardProps<ValueByStatusChartData>) {
  return (
    <ChartCard
      title="Contract value by status group"
      metricId="contractValueByStatus"
      takeaway={chart.takeaway}
      table={chart.table}
      badge={badge}
      className={className}
      ariaLabel="Stacked column chart of contract value by status group, split into on track, watch and at risk"
    >
      <StackedBarChart
        data={chart.points}
        categoryKey="label"
        orientation="columns"
        series={[
          { key: "onTrack", name: "On track", color: CHART_COLORS.good },
          { key: "watch", name: "Watch", color: CHART_COLORS.watch },
          { key: "atRisk", name: "At risk", color: CHART_COLORS.bad }
        ]}
        formatValue={formatRupiahMillions}
        moneyAxis
      />
    </ChartCard>
  );
}

export function DumbbellCard({ chart, badge, className }: CardProps<DumbbellChartData>) {
  return (
    <ChartCard
      title="Plan vs actual per project"
      metricId="deviation"
      takeaway={chart.takeaway}
      table={chart.table}
      badge={badge}
      className={className}
      empty={chart.points.length === 0 ? { title: "No project is in progress" } : null}
      ariaLabel="Dumbbell chart of planned against actual progress for each in-progress project, worst deviation first. Project names link to the project."
    >
      <DumbbellChart points={chart.points} />
    </ChartCard>
  );
}

export function RevenueWaterfallCard({
  chart,
  title,
  badge,
  className
}: CardProps<WaterfallChartData> & { title: string }) {
  return (
    <ChartCard
      title={title}
      metricId="revenueWaterfall"
      takeaway={chart.takeaway}
      table={chart.table}
      badge={badge}
      className={className}
      empty={chart.steps.length === 0 ? { title: "No earning rule for this project", description: "Only a project with signed BAs per component has this chart." } : null}
      ariaLabel="Waterfall chart from contract value to earned with signed BA, accrued, billed and Retensi still to bill"
    >
      <WaterfallChart steps={chart.steps} />
    </ChartCard>
  );
}

export function EarningStagesCard({ chart, badge, className }: CardProps<EarningStageChartData>) {
  return (
    <ChartCard
      title="Earning stages 15/15/30/30/10: earned vs blocked"
      metricId="earnedValue"
      takeaway={chart.takeaway}
      table={chart.table}
      badge={badge}
      className={className}
      empty={chart.points.length === 0 ? { title: "No earning stages for this project" } : null}
      ariaLabel="Stacked bar chart per earning stage: earned with a signed BA, claimed without a signed BA, and not started"
    >
      <StackedBarChart
        data={chart.points}
        categoryKey="label"
        orientation="bars"
        labelWidth={190}
        series={[
          { key: "earned", name: "Earned", color: CHART_COLORS.actual },
          { key: "blocked", name: "Blocked", color: CHART_COLORS.bad },
          { key: "open", name: "Not started", color: CHART_COLORS.neutral }
        ]}
        formatValue={formatRupiahMillions}
        moneyAxis
      />
    </ChartCard>
  );
}

export function SCurveCard({ chart, badge, className }: CardProps<SCurveChartData>) {
  return (
    <ChartCard
      title="S-curve: plan, actual and required pace"
      formula="Plan and actual are cumulative progress per week. The shaded area is plan minus actual up to today; the dotted line is the pace needed to reach 100% in the last planned week."
      takeaway={chart.takeaway}
      table={chart.table}
      badge={badge}
      className={className}
      empty={chart.points.length === 0 ? { title: "No weekly schedule yet", description: "This project has not started, so there is no plan or actual curve." } : null}
      ariaLabel="Line chart of cumulative planned and actual progress by week, with the gap to plan shaded and the pace needed to finish on time"
    >
      <SCurveChart
        points={chart.points}
        todayLabel={chart.todayLabel}
        requiredPace={chart.requiredPace}
        forecastPace={chart.forecastPace}
      />
    </ChartCard>
  );
}

export function WeeklyIncrementsCard({ chart, badge, className }: CardProps<WeeklyIncrementChartData>) {
  return (
    <ChartCard
      title="Progress gained per week"
      metricId="weeklyIncrement"
      takeaway={chart.takeaway}
      table={chart.table}
      badge={badge}
      className={className}
      empty={chart.points.length === 0 ? { title: "No measured weeks yet" } : null}
      ariaLabel="Column chart of progress gained in each measured week; weeks without progress are marked in red"
    >
      <StackedBarChart
        data={chart.points}
        categoryKey="label"
        orientation="columns"
        height={260}
        tickInterval={1}
        series={[
          { key: "gain", name: "Progress gained", color: CHART_COLORS.actual },
          { key: "marker", name: "Week with no progress", color: CHART_COLORS.bad }
        ]}
        formatValue={(value) => `${formatDecimal(value, 1)} pts`}
        formatTick={(value) => formatDecimal(value, 0)}
        renderTooltip={(point: IncrementPoint) => (
          <>
            <p className="mb-1 font-semibold">Week {point.weekNo}</p>
            <p className="tabular-nums">{point.zero ? "No progress this week" : `Gained ${formatPoints(point.gain)}`}</p>
          </>
        )}
      />
    </ChartCard>
  );
}

export function DeficitCard({ chart, badge, className }: CardProps<DeficitChartData>) {
  return (
    <ChartCard
      title="Deficit per work package"
      metricId="componentDeficit"
      takeaway={chart.takeaway}
      table={chart.table}
      badge={badge}
      className={className}
      empty={chart.points.length === 0 ? { title: "No work packages", description: "Only the Kapasitor Bank project has a component schedule." } : null}
      ariaLabel="Bar chart of how many points of the plan deviation each work package explains"
    >
      <StackedBarChart
        data={chart.points}
        categoryKey="label"
        orientation="bars"
        labelWidth={150}
        showLegend={false}
        series={[{ key: "deficitPts", name: "Deficit", color: CHART_COLORS.actual }]}
        formatValue={formatPointsUnsigned}
        formatTick={(value) => formatDecimal(value, 0)}
        renderTooltip={(point: DeficitPoint) => (
          <>
            <p className="mb-1 font-semibold"><Tr>{point.label}</Tr></p>
            <p className="tabular-nums">Weight {formatPercent(point.weight)}</p>
            <p className="tabular-nums">Deficit {formatPointsUnsigned(point.deficitPts)}</p>
            <p className="tabular-nums font-semibold">{formatPercent(point.share, 2)} of the deviation</p>
          </>
        )}
      />
    </ChartCard>
  );
}

export function CostBulletCard({ chart, badge, className }: CardProps<CostChartData>) {
  return (
    <ChartCard
      title="RAP budget vs realised cost"
      metricId="cost"
      takeaway={chart.takeaway}
      table={chart.table}
      badge={badge}
      className={className}
      empty={chart.points.length === 0 ? { title: "No budget or cost yet" } : null}
      ariaLabel="Bar chart per RAP category: share of the RAP budget used, with a marker at 100%; categories over RAP are red"
    >
      <RapUsageChart points={chart.points} />
    </ChartCard>
  );
}

export function MarginBridgeCard({ chart, badge, className }: CardProps<WaterfallChartData>) {
  return (
    <ChartCard
      title="Margin bridge: revenue to profit"
      metricId="marginBridge"
      takeaway={chart.takeaway}
      table={chart.table}
      badge={badge}
      className={className}
      empty={chart.steps.length === 0 ? { title: "No recognised revenue yet", description: "The bridge starts when progress is measured." } : null}
      ariaLabel="Waterfall chart from recognised revenue, less cost per RAP category, to profit to date"
    >
      <WaterfallChart steps={chart.steps} />
    </ChartCard>
  );
}

export function CoverageCard({ chart, badge, className }: CardProps<CoverageChartData>) {
  return (
    <ChartCard
      title="Inspections per contract: done, due and overdue"
      metricId="coverage"
      takeaway={chart.takeaway}
      table={chart.table}
      badge={badge}
      className={className}
      empty={chart.points.length === 0 ? { title: "No service contracts" } : null}
      ariaLabel="Stacked bar chart per service contract: inspections done, due (scheduled) and overdue"
    >
      <StackedBarChart
        data={chart.points}
        categoryKey="contractId"
        orientation="bars"
        labelWidth={90}
        allowDecimals={false}
        valueTicks={niceTicks(Math.max(0, ...chart.points.map((p) => p.done + p.upcoming + p.overdue)))}
        series={[
          { key: "done", name: "Done", color: CHART_COLORS.actual },
          { key: "upcoming", name: "Due (scheduled)", color: CHART_COLORS.primaryLight },
          { key: "overdue", name: "Overdue", color: CHART_COLORS.bad }
        ]}
        formatValue={(value) => String(value)}
      />
    </ChartCard>
  );
}

export function ActionsByOwnerCard({ chart, badge, className }: CardProps<ActionChartData<OwnerStatusPoint>>) {
  return (
    <ChartCard
      title="Unfinished actions by owner role"
      metricId="actionsByOwner"
      takeaway={chart.takeaway}
      table={chart.table}
      badge={badge}
      className={className}
      empty={chart.points.length === 0 ? { title: "No unfinished actions" } : null}
      ariaLabel="Stacked bar chart of open and in-progress actions per owner role"
    >
      <StackedBarChart
        data={chart.points}
        categoryKey="ownerRole"
        orientation="bars"
        labelWidth={210}
        allowDecimals={false}
        series={[
          { key: "open", name: "Open", color: CHART_COLORS.primaryLight },
          { key: "inProgress", name: "In progress", color: CHART_COLORS.actual }
        ]}
        formatValue={(value) => String(value)}
      />
    </ChartCard>
  );
}

const AGING_COLOR: Record<AgingBucket["id"], string> = {
  overdue: CHART_COLORS.bad,
  week: CHART_COLORS.watch,
  "two-weeks": CHART_COLORS.primaryLight,
  later: CHART_COLORS.primaryLight
};

export function AgingCard({ chart, badge, className }: CardProps<ActionChartData<AgingBucket>>) {
  return (
    <ChartCard
      title="Unfinished actions by due date"
      metricId="actionAging"
      takeaway={chart.takeaway}
      table={chart.table}
      badge={badge}
      className={className}
      empty={chart.takeaway === null ? { title: "No unfinished actions" } : null}
      ariaLabel="Column chart of unfinished actions grouped by how soon they are due; overdue is red and due within a week is amber"
    >
      <StackedBarChart
        data={chart.points}
        categoryKey="label"
        orientation="bars"
        labelWidth={190}
        allowDecimals={false}
        showLegend={false}
        series={[{ key: "count", name: "Actions", color: CHART_COLORS.primaryLight }]}
        colorOf={(bucket) => AGING_COLOR[bucket.id]}
        formatValue={(value) => String(value)}
      />
    </ChartCard>
  );
}

/** S2: Retensi held by age; buckets past the alert threshold are red, the rest amber. */
export function RetentionAgeingCard({ chart, badge, className }: CardProps<RetentionAgeingChartData>) {
  return (
    <ChartCard
      title="Retensi ageing"
      formula="Retensi held per payment stage, grouped by days since it fell due; over 180 days is aged"
      takeaway={chart.takeaway}
      table={chart.table}
      badge={badge}
      className={className}
      empty={chart.total === 0 ? { title: "No Retensi held" } : null}
      ariaLabel="Bar chart of Retensi held by age bucket, aged buckets in red"
    >
      <StackedBarChart
        data={chart.points}
        categoryKey="label"
        orientation="bars"
        labelWidth={130}
        showLegend={false}
        series={[{ key: "amount", name: "Retensi held", color: CHART_COLORS.watch }]}
        colorOf={(point) => (point.aged ? CHART_COLORS.bad : CHART_COLORS.watch)}
        formatValue={formatRupiahMillions}
        moneyAxis
      />
    </ChartCard>
  );
}
