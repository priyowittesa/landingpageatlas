"use client";

import { useMemo, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useProjects } from "@/app/app/master-data/projects/use-projects";
import { FilterBar, KpiCardRow, AiInsightsSection } from "./shared-components";
import { DailyDiariesTab } from "./DailyDiariesTab";
import { LabourRosteringTab } from "./LabourRosteringTab";
import {
  dailyDiariesInsights,
  labourRosteringInsights,
  type KpiCard,
} from "./mock-data";
import {
  useDashboardSummary,
  useRosteringSummary,
  type DashboardFilter,
  type RosteringFilter,
} from "./use-dashboard";
import {
  timeAgo,
  useLabourInsights,
  useScanLabourInsights,
} from "./use-labour-insights";
import DashboardPage from "../../capacity-analytic/dashboard/page";

export type DashboardTabKey =
  | "labour-rostering"
  | "daily-diaries"
  | "capacity-analytic";

const TAB_CONFIG: Record<
  DashboardTabKey,
  {
    label: string;
    insights: typeof dailyDiariesInsights;
    insightCount: number;
    updatedAt: string;
  }
> = {
  "labour-rostering": {
    label: "Labour Rostering",
    insights: labourRosteringInsights,
    insightCount: 3,
    updatedAt: "2 min ago",
  },
  "daily-diaries": {
    label: "Daily Diaries",
    insights: dailyDiariesInsights,
    insightCount: 4,
    updatedAt: "5 min ago",
  },
  "capacity-analytic": {
    label: "Capacity Analytic",
    insights: dailyDiariesInsights,
    insightCount: 4,
    updatedAt: "5 min ago",
  },
};

function buildDailyDiariesKpis(
  summary:
    | {
        submitted_diaries: number;
        total_diaries: number;
        total_man_hours: number;
        total_delay_hours: number;
        open_issues: number;
        average_temperature_c: number | null;
      }
    | undefined,
): KpiCard[] {
  if (!summary) {
    return [
      { id: "dd1", label: "Diary Submitted", value: "—" },
      { id: "dd2", label: "Total Man-Hour", value: "—" },
      { id: "dd3", label: "Total Delay Hours", value: "—" },
      { id: "dd4", label: "Open Issues", value: "—" },
      { id: "dd5", label: "AVG Temperature", value: "—" },
    ];
  }
  return [
    {
      id: "dd1",
      label: "Diary Submitted",
      value: `${summary.submitted_diaries ?? 0}/${summary.total_diaries ?? 0}`,
    },
    {
      id: "dd2",
      label: "Total Man-Hour",
      value: (summary.total_man_hours ?? 0).toLocaleString(),
    },
    {
      id: "dd3",
      label: "Total Delay Hours",
      value: String(summary.total_delay_hours ?? 0),
    },
    {
      id: "dd4",
      label: "Open Issues",
      value: String(summary.open_issues ?? 0),
    },
    {
      id: "dd5",
      label: "AVG Temperature",
      value:
        summary.average_temperature_c != null
          ? `${summary.average_temperature_c.toFixed(1)}°C`
          : "—",
    },
  ];
}

function buildLabourRosteringKpis(
  summary:
    | {
        total_workers: number;
        total_projects: number;
        active_projects: number;
        inactive_projects: number;
        assigned_workers: number;
      }
    | undefined,
): KpiCard[] {
  if (!summary) {
    return [
      { id: "lr1", label: "Total Worker", value: "—" },
      { id: "lr2", label: "Total Project", value: "—" },
      { id: "lr3", label: "Project Active", value: "—" },
      { id: "lr4", label: "Project Inactive", value: "—" },
      { id: "lr5", label: "Worker Assigned", value: "—" },
    ];
  }
  return [
    {
      id: "lr1",
      label: "Total Worker",
      value: String(summary.total_workers ?? 0),
    },
    {
      id: "lr2",
      label: "Total Project",
      value: String(summary.total_projects ?? 0),
    },
    {
      id: "lr3",
      label: "Project Active",
      value: String(summary.active_projects ?? 0),
    },
    {
      id: "lr4",
      label: "Project Inactive",
      value: String(summary.inactive_projects ?? 0),
    },
    {
      id: "lr5",
      label: "Worker Assigned",
      value: String(summary.assigned_workers ?? 0),
    },
  ];
}

export function AnalyticsDashboard({
  hasLabourRostering,
  hasDailyDiaries,
  hasCapacityAnalytic,
}: {
  hasLabourRostering: boolean;
  hasDailyDiaries: boolean;
  hasCapacityAnalytic: boolean;
}) {
  // Only render tabs the user actually has module access to. Order matches the
  // Figma design: Labour Rostering first, then Daily Diaries.
  const availableTabs: DashboardTabKey[] = [
    ...(hasLabourRostering ? (["labour-rostering"] as const) : []),
    ...(hasDailyDiaries ? (["daily-diaries"] as const) : []),
    ...(hasCapacityAnalytic ? (["capacity-analytic"] as const) : []),
  ];

  const [activeTab, setActiveTab] = useState<DashboardTabKey>(
    availableTabs[0] ?? "daily-diaries",
  );

  // Guard against an active tab the user lost access to (e.g. after a refetch).
  const currentTab = availableTabs.includes(activeTab)
    ? activeTab
    : (availableTabs[0] ?? "daily-diaries");
  const config = TAB_CONFIG[currentTab];

  // Shared filter state — drives both the FilterBar UI and the dashboard
  // data-fetching hooks. project_id is shared; the date range maps to
  // date_from/date_to for Daily Diaries and start_date/end_date for Labour
  // Rostering (the two APIs use different param names).
  const [projectId, setProjectId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: projects, isLoading: projectsLoading } = useProjects();

  const handleReset = () => {
    setProjectId("");
    setDateFrom("");
    setDateTo("");
  };

  const filter: DashboardFilter = useMemo(
    () => ({
      project_id: projectId || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }),
    [projectId, dateFrom, dateTo],
  );

  const rosteringFilter: RosteringFilter = useMemo(
    () => ({
      project_id: projectId || undefined,
      start_date: dateFrom || undefined,
      end_date: dateTo || undefined,
    }),
    [projectId, dateFrom, dateTo],
  );

  // Daily Diaries KPIs come from the dashboard-summary endpoint. Labour
  // Rostering KPIs come from the rostering dashboard-summary endpoint.
  const { data: summary, isLoading: summaryLoading } =
    useDashboardSummary(filter);
  const { data: rosteringSummary, isLoading: rosteringSummaryLoading } =
    useRosteringSummary(rosteringFilter);

  const kpis =
    currentTab === "daily-diaries"
      ? buildDailyDiariesKpis(summary)
      : buildLabourRosteringKpis(rosteringSummary);
  const kpisLoading =
    currentTab === "daily-diaries" ? summaryLoading : rosteringSummaryLoading;

  // Labour Rostering insights come from the API; "Get Insight" asks the AI to
  // scan again. The other tabs still show the design's sample insights.
  const isRostering = currentTab === "labour-rostering";
  const labourInsightsFilter = useMemo(
    () => ({ project_id: projectId || undefined }),
    [projectId],
  );
  const labourInsights = useLabourInsights(labourInsightsFilter, isRostering);
  const scanInsights = useScanLabourInsights();

  return (
    <div className="space-y-5 pb-6">
      {/* Page title */}
      <div>
        <h1 className="text-xl font-bold tracking-[-0.02em] text-gray-950">
          Dashboard
        </h1>
        <p className="mt-0.5 text-xs text-gray-500">
          Monitor daily diary submissions, field activities, and workforce
          productivity
        </p>
      </div>

      {/* Tabs — full-width segmented control. Hidden when only one module. */}
      {availableTabs.length > 1 && (
        <div className="grid grid-cols-3 gap-2 rounded-xl border border-gray-200 bg-white p-1.5">
          {availableTabs.map((tabKey) => (
            <button
              key={tabKey}
              type="button"
              onClick={() => setActiveTab(tabKey)}
              className={cn(
                "rounded-lg py-2 text-sm font-semibold transition-colors",
                currentTab === tabKey
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700",
              )}
            >
              {TAB_CONFIG[tabKey].label}
            </button>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <FilterBar
        projects={
          projects?.map((project) => ({
            id: project.id,
            title: project.title,
          })) ?? []
        }
        projectsLoading={projectsLoading}
        projectId={projectId}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onProjectChange={setProjectId}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onReset={handleReset}
      />

      {/* KPI cards */}
      {kpisLoading ? (
        <div className="flex h-20 items-center justify-center">
          <Spinner className="size-6 text-primary" />
        </div>
      ) : (
        <KpiCardRow cards={kpis} />
      )}

      {/* AI Insights */}
      {isRostering ? (
        <AiInsightsSection
          insights={labourInsights.data?.items ?? []}
          insightCount={labourInsights.data?.totalCount ?? 0}
          updatedAt={timeAgo(labourInsights.data?.latestAt ?? null)}
          loading={labourInsights.isLoading}
          actionLabel="Get Insight"
          onAction={() => scanInsights.mutate()}
          actionPending={scanInsights.isPending}
        />
      ) : (
        <AiInsightsSection
          insights={config.insights}
          insightCount={config.insightCount}
          updatedAt={config.updatedAt}
        />
      )}

      {/* Tab content */}
      {currentTab === "daily-diaries" ? (
        <DailyDiariesTab filter={filter} />
      ) : currentTab === "labour-rostering" ? (
        <LabourRosteringTab filter={rosteringFilter} />
      ) : currentTab === "capacity-analytic" ? (
        <DashboardPage />
      ) : (
        <></>
      )}
    </div>
  );
}
