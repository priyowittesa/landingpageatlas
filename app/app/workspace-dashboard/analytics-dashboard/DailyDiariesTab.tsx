"use client";

import {
  ComposedChart,
  Line,
  LineChart,
  Area,
  ReferenceLine,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { Spinner } from "@/components/ui/spinner";
import { ChartCard, HorizontalBarList } from "./shared-components";
import {
  useComplianceTrend,
  useIssueDelayBreakdown,
  useIssueStatusSummary,
  useManHoursPerActivity,
  type DashboardFilter,
  type IssueStatusItem
} from "./use-dashboard";

const ISSUE_STATUS_COLORS: Record<string, string> = {
  open: "#f59e0b",
  in_progress: "#3b82f6",
  closed: "#22c55e"
};

function formatPeriodLabel(start: string): string {
  const d = new Date(start);
  if (Number.isNaN(d.getTime())) return start;
  return `${d.toLocaleDateString("en-US", { month: "short" })} ${d.getDate()}`;
}

// ---------------------------------------------------------------------------
// Diary Compliance Trend (line chart with target + area fill)
// ---------------------------------------------------------------------------

function ComplianceTrendChart({ filter }: { filter: DashboardFilter }) {
  const { data, isLoading } = useComplianceTrend(filter);

  if (isLoading) {
    return (
      <ChartCard title="Diary Compliance Trend" badge="Last 30 days">
        <div className="flex h-50 items-center justify-center">
          <Spinner className="size-6 text-primary" />
        </div>
      </ChartCard>
    );
  }

  const points =
    data?.points
      .filter((p) => p.compliance_percent !== null)
      .map((p) => ({
        date: formatPeriodLabel(p.period_start),
        compliance: p.compliance_percent ?? 0
      })) ?? [];
  const target = data?.target_percent ?? 90;

  return (
    <ChartCard title="Diary Compliance Trend" badge="Last 30 days">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart
          data={points}
          margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
        >
          <defs>
            <linearGradient id="complianceArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f0f0f0"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 11
            }}
            formatter={(v) => [`${v}%`, "Compliance"]}
          />
          <ReferenceLine
            y={target}
            stroke="#ef4444"
            strokeDasharray="4 4"
            strokeWidth={1}
            label={{
              value: "Target",
              position: "right",
              fill: "#ef4444",
              fontSize: 10
            }}
          />
          <Area
            type="monotone"
            dataKey="compliance"
            stroke="none"
            fill="url(#complianceArea)"
          />
          <Line
            type="monotone"
            dataKey="compliance"
            stroke="#7c3aed"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#7c3aed" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ---------------------------------------------------------------------------
// Issue Type vs Delay Hours (Pareto: bars + cumulative line)
// ---------------------------------------------------------------------------

function IssueTypePareto({ filter }: { filter: DashboardFilter }) {
  const { data, isLoading } = useIssueDelayBreakdown(filter);

  if (isLoading) {
    return (
      <ChartCard title="Issue Type vs Delay Hours">
        <div className="flex h-55 items-center justify-center">
          <Spinner className="size-6 text-primary" />
        </div>
      </ChartCard>
    );
  }

  const items =
    data?.items.map((item) => ({
      type: item.issue_type,
      hours: item.delay_hours,
      cumulative: item.cumulative_percent
    })) ?? [];

  return (
    <ChartCard
      title="Issue Type vs Delay Hours"
      headerRight={
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <span className="h-2 w-2 rounded-full bg-primary-600" />
            Hours
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <span className="h-2 w-2 rounded-full bg-gray-400" />
            Cumulative %
          </span>
        </div>
      }
    >
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart
          data={items}
          margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f0f0f0"
            vertical={false}
          />
          <XAxis
            dataKey="type"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            interval={0}
            angle={-12}
            textAnchor="end"
            height={50}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 11
            }}
          />
          <Bar
            yAxisId="left"
            dataKey="hours"
            fill="#7c3aed"
            radius={[4, 4, 0, 0]}
            barSize={36}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cumulative"
            stroke="#9ca3af"
            strokeWidth={2}
            dot={{ r: 3, fill: "#9ca3af" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ---------------------------------------------------------------------------
// Issue Status (doughnut with center total + legend)
// ---------------------------------------------------------------------------

function statusLabel(status: string): string {
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function IssueStatusDoughnut({ filter }: { filter: DashboardFilter }) {
  const { data, isLoading } = useIssueStatusSummary(filter);

  if (isLoading) {
    return (
      <ChartCard title="Issue Status">
        <div className="flex h-45 items-center justify-center">
          <Spinner className="size-6 text-primary" />
        </div>
      </ChartCard>
    );
  }

  const items: { label: string; value: number; color: string }[] =
    data?.items
      .filter((item: IssueStatusItem) => item.count > 0)
      .map((item) => ({
        label: statusLabel(item.status),
        value: item.count,
        color: ISSUE_STATUS_COLORS[item.status] ?? "#9ca3af"
      })) ?? [];
  const total = data?.total_issues ?? 0;

  return (
    <ChartCard
      title="Issue Status"
      headerRight={
        <span className="text-[11px] font-medium text-gray-500">
          {total} issues
        </span>
      }
    >
      <div className="flex items-center gap-6">
        <div className="relative h-45 w-45 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={items}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                stroke="none"
              >
                {items.map((entry) => (
                  <Cell key={entry.label} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  fontSize: 11
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-950">{total}</span>
            <span className="text-[11px] text-gray-400">Total</span>
          </div>
        </div>
        <div className="space-y-3">
          {data?.items.map((entry) => (
            <div key={entry.status} className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-sm"
                style={{
                  backgroundColor:
                    ISSUE_STATUS_COLORS[entry.status] ?? "#9ca3af"
                }}
              />
              <div>
                <p className="text-[11px] font-medium text-gray-700">
                  {statusLabel(entry.status)}
                </p>
                <p className="text-[10px] text-gray-400">
                  {entry.count} ·{" "}
                  {entry.percentage !== null
                    ? `${entry.percentage.toFixed(1)}%`
                    : "—"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}

// ---------------------------------------------------------------------------
// Man-hour per Activity Code / WBS (Top 10) — real API
// ---------------------------------------------------------------------------

function ManhourPerActivity({ filter }: { filter: DashboardFilter }) {
  const { data, isLoading } = useManHoursPerActivity(filter);

  if (isLoading) {
    return (
      <ChartCard title="Man-hour per Activity Code (WBS)" badge="Top 10">
        <div className="flex h-50 items-center justify-center">
          <Spinner className="size-6 text-primary" />
        </div>
      </ChartCard>
    );
  }

  const items = data?.items ?? [];
  const maxHours = Math.max(1, ...items.map((a) => a.total_hours));

  return (
    <ChartCard title="Man-hour per Activity Code (WBS)" badge="Top 10">
      <HorizontalBarList
        items={items.map((a) => ({
          label: a.activity_name,
          sublabel: a.activity_code || undefined,
          value: a.total_hours,
          maxValue: maxHours,
          valueLabel: `${a.total_hours}h`
        }))}
      />
    </ChartCard>
  );
}

// ---------------------------------------------------------------------------
// Daily Diaries tab (full)
// ---------------------------------------------------------------------------

export function DailyDiariesTab({ filter = {} }: { filter?: DashboardFilter }) {
  return (
    <div className="space-y-4">
      <ComplianceTrendChart filter={filter} />
      <div className="grid gap-4 lg:grid-cols-2">
        <IssueTypePareto filter={filter} />
        <IssueStatusDoughnut filter={filter} />
      </div>
      <ManhourPerActivity filter={filter} />
    </div>
  );
}
