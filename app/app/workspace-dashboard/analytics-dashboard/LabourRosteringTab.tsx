"use client";

import { useMemo } from "react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { ChartCard, HorizontalBarList } from "./shared-components";
import {
  useEmployeeOverlap,
  useProjectTimeline,
  useShiftDistribution,
  type RosteringFilter,
  type ShiftDistributionItem
} from "./use-dashboard";

// ---------------------------------------------------------------------------
// Employee Overlap (concurrent projects)
// ---------------------------------------------------------------------------

function EmployeeOverlapChart({ filter }: { filter: RosteringFilter }) {
  const { data, isLoading } = useEmployeeOverlap(filter);

  if (isLoading) {
    return (
      <ChartCard title="Employee Overlap" badge="Concurrent projects">
        <div className="flex h-45 items-center justify-center">
          <Spinner className="size-6 text-primary" />
        </div>
      </ChartCard>
    );
  }

  const items = data?.items ?? [];
  const maxCount = Math.max(1, ...items.map((e) => e.overlap_count));

  return (
    <ChartCard title="Employee Overlap" badge="Concurrent projects">
      {items.length === 0 ? (
        <p className="py-8 text-center text-xs text-gray-400">
          No employee overlap data
        </p>
      ) : (
        <HorizontalBarList
          items={items.map((e) => ({
            label: e.employee_name,
            value: e.overlap_count,
            maxValue: maxCount + 1,
            valueLabel: String(e.overlap_count)
          }))}
          primaryColor="bg-primary-700"
        />
      )}
      <div className="mt-4 flex items-center gap-4 border-t border-gray-100 pt-3">
        <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <span className="h-2.5 w-2.5 rounded-full bg-primary-700" />
          Overlapping (&gt; 1)
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <span className="h-2.5 w-2.5 rounded-full bg-primary-200" />
          Single Project
        </span>
      </div>
    </ChartCard>
  );
}

// ---------------------------------------------------------------------------
// Shift Distribution per Employee (stacked horizontal bars)
// ---------------------------------------------------------------------------

// Fallback palette for shifts that come back with an empty hex_color.
const FALLBACK_SHIFT_COLORS = [
  "#2563EB",
  "#7C3AED",
  "#F59E0B",
  "#22C55E",
  "#EF4444",
  "#6B7280"
];

// Semantic fallback colors keyed by shift name keyword (used when the API
// does not return a hex_color for a shift).
const SHIFT_COLOR_BY_KEYWORD: Record<string, string> = {
  morning: "#5829a8",
  pagi: "#5829a8",
  night: "#a77bf3",
  malam: "#a77bf3",
  holiday: "#f2ebfd",
  libur: "#e5e7eb",
  off: "#e5e7eb",
  cuti: "#f2ebfd"
};

function shiftColor(shiftName: string, hex: string, index: number): string {
  if (hex) return hex;
  const key = shiftName.toLowerCase();
  for (const [keyword, color] of Object.entries(SHIFT_COLOR_BY_KEYWORD)) {
    if (key.includes(keyword)) return color;
  }
  return FALLBACK_SHIFT_COLORS[index % FALLBACK_SHIFT_COLORS.length];
}

function ShiftDistributionChart({ filter }: { filter: RosteringFilter }) {
  const { data, isLoading } = useShiftDistribution(filter);

  if (isLoading) {
    return (
      <ChartCard title="Shift Distribution per Employee" badge="Last 30 days">
        <div className="flex h-45 items-center justify-center">
          <Spinner className="size-6 text-primary" />
        </div>
      </ChartCard>
    );
  }

  const items = data?.items ?? [];
  // Build a stable legend from all unique shifts across employees.
  const legend = items.length
    ? Array.from(
        new Map(
          items.flatMap((emp: ShiftDistributionItem) =>
            emp.shifts.map((s) => [s.shift_id, s])
          )
        ).values()
      )
    : [];

  return (
    <ChartCard title="Shift Distribution per Employee" badge="Last 30 days">
      {items.length === 0 ? (
        <p className="py-8 text-center text-xs text-gray-400">
          No shift distribution data
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((emp) => {
            const total =
              emp.total_days || emp.shifts.reduce((sum, s) => sum + s.days, 0);
            return (
              <div key={emp.employee_id} className="flex items-center gap-3">
                <div className="w-24 shrink-0 truncate text-[11px] font-medium text-gray-700">
                  {emp.employee_name}
                </div>
                <div className="flex h-4 flex-1 overflow-hidden rounded-full bg-gray-50">
                  {emp.shifts.map((segment, i) => {
                    if (segment.days === 0) return null;
                    return (
                      <div
                        key={segment.shift_id}
                        className="h-full"
                        style={{
                          width: `${(segment.days / total) * 100}%`,
                          backgroundColor: shiftColor(
                            segment.shift_name,
                            segment.hex_color,
                            i
                          )
                        }}
                        title={`${segment.shift_name}: ${segment.days} days`}
                      />
                    );
                  })}
                </div>
                <div className="w-12 shrink-0 text-right text-[10px] text-gray-400">
                  {total}d
                </div>
              </div>
            );
          })}
        </div>
      )}
      {legend.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-gray-100 pt-3">
          {legend.map((shift, i) => (
            <span
              key={shift.shift_id}
              className="flex items-center gap-1.5 text-[10px] text-gray-500"
            >
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{
                  backgroundColor: shiftColor(
                    shift.shift_name,
                    shift.hex_color,
                    i
                  )
                }}
              />
              {shift.shift_name}
            </span>
          ))}
        </div>
      )}
    </ChartCard>
  );
}

// ---------------------------------------------------------------------------
// Project Timeline (assignment spans grouped by project)
// ---------------------------------------------------------------------------

const MS_PER_DAY = 86_400_000;
// Width of the sticky "PROJECT / WORKER" column, in px.
const GANTT_LABEL_WIDTH = 150;
// Keep weekly date labels readable instead of squeezing the calendar on mobile.
const GANTT_DAY_WIDTH = 12;
const GANTT_MIN_TRACK_WIDTH = 420;
// Bars narrower than this (% of the track) cannot fit their date label inside.
const MIN_INLINE_LABEL_PERCENT = 14;

type GanttTick = { key: string; label: string; percent: number };

type GanttPeriod = {
  start: string;
  end: string;
  scheduledDays: number;
  leftPercent: number;
  widthPercent: number;
};

type GanttAssignment = {
  key: string;
  name: string;
  start: string;
  end: string;
  durationDays: number;
  hasDates: boolean;
  periods: GanttPeriod[];
};

type GanttGroup = {
  projectId: string;
  projectName: string;
  projectStatus: string;
  assignments: GanttAssignment[];
};

function toDate(day: string): Date {
  return new Date(`${day}T00:00:00`);
}

function daysBetween(from: string, to: string): number {
  return Math.round(
    (toDate(to).getTime() - toDate(from).getTime()) / MS_PER_DAY
  );
}

function formatShortDate(day: string): string {
  return toDate(day).toLocaleString("en-US", {
    month: "short",
    day: "numeric"
  });
}

function formatLongDate(day: string): string {
  return toDate(day).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function GanttAssignmentRow({
  assignment,
  ticks
}: {
  assignment: GanttAssignment;
  ticks: GanttTick[];
}) {
  return (
    <div className="flex items-center border-b border-gray-50 last:border-b-0">
      <div
        className="sticky left-0 z-10 shrink-0 truncate bg-white pl-3 pr-2 text-[10px] font-medium text-gray-600"
        style={{ width: GANTT_LABEL_WIDTH }}
        title={assignment.name}
      >
        {assignment.name}
      </div>
      <div className="relative h-6 min-w-0 flex-1">
        {ticks.map((tick) => (
          <span
            key={`guide-${tick.key}`}
            className="absolute inset-y-0 w-px bg-gray-100"
            style={{ left: `${tick.percent}%` }}
          />
        ))}
        {assignment.periods.map((period, i) => {
          const rangeLabel = `${formatShortDate(period.start)} - ${formatShortDate(period.end)}`;
          const canInline = period.widthPercent >= MIN_INLINE_LABEL_PERCENT;
          return (
            <div
              key={i}
              className="group absolute top-1/2 flex h-3.5 -translate-y-1/2 items-center justify-end rounded-full px-1.5 bg-primary-700"
              style={{
                left: `${period.leftPercent}%`,
                width: `${period.widthPercent}%`,
                minWidth: 10
              }}
            >
              {canInline && (
                <span className="truncate text-[8px] font-semibold text-white">
                  {rangeLabel}
                </span>
              )}
              <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-max -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-left shadow-md group-hover:block">
                <p className="text-[10px] font-semibold text-gray-900">
                  {assignment.name}
                </p>
                <dl className="mt-1 space-y-0.5">
                  <div className="flex gap-4">
                    <dt className="text-[9px] text-gray-400">Start</dt>
                    <dd className="ml-auto text-[9px] font-medium text-gray-700">
                      {formatLongDate(period.start)}
                    </dd>
                  </div>
                  <div className="flex gap-4">
                    <dt className="text-[9px] text-gray-400">End</dt>
                    <dd className="ml-auto text-[9px] font-medium text-gray-700">
                      {formatLongDate(period.end)}
                    </dd>
                  </div>
                  <div className="flex gap-4">
                    <dt className="text-[9px] text-gray-400">Scheduled</dt>
                    <dd className="ml-auto text-[9px] font-medium text-gray-700">
                      {period.scheduledDays} days
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProjectTimelineGantt({ filter }: { filter: RosteringFilter }) {
  const { data, isLoading } = useProjectTimeline(filter);

  const rangeStart = data?.start_date ?? "";
  const rangeEnd = data?.end_date ?? "";
  const weekStartDates = data?.week_start_dates;

  const totalDays = useMemo(
    () => (rangeStart && rangeEnd ? daysBetween(rangeStart, rangeEnd) + 1 : 0),
    [rangeStart, rangeEnd]
  );
  const timelineMinWidth =
    GANTT_LABEL_WIDTH + Math.max(GANTT_MIN_TRACK_WIDTH, totalDays * GANTT_DAY_WIDTH);

  const ticks = useMemo<GanttTick[]>(
    () =>
      (weekStartDates ?? []).map((day) => ({
        key: day,
        label: formatShortDate(day),
        percent:
          totalDays > 0 ? (daysBetween(rangeStart, day) / totalDays) * 100 : 0
      })),
    [weekStartDates, rangeStart, totalDays]
  );

  const groups = useMemo<GanttGroup[]>(
    () =>
      (data?.projects ?? []).map((project) => ({
        projectId: project.project_id,
        projectName: project.project_name || "Unassigned Project",
        projectStatus: project.project_status,
        assignments: project.assignments
          .map((assignment) => {
            const start = assignment.start_date;
            const end = assignment.end_date;
            const hasDates = Boolean(start && end);
            return {
              key: assignment.member_id,
              name: assignment.employee_name || "Unnamed worker",
              start: start || rangeStart,
              end: end || rangeEnd,
              durationDays: assignment.duration_days,
              hasDates,
              periods: (assignment.periods ?? []).map((period) => {
                const periodStart = period.start_date;
                const periodEnd = period.end_date;
                const span = daysBetween(periodStart, periodEnd) + 1;
                return {
                  start: periodStart,
                  end: periodEnd,
                  scheduledDays: period.scheduled_days,
                  leftPercent:
                    totalDays > 0
                      ? (daysBetween(rangeStart, periodStart) / totalDays) * 100
                      : 0,
                  widthPercent: totalDays > 0 ? (span / totalDays) * 100 : 0
                };
              })
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name))
      })),
    [data, rangeStart, rangeEnd, totalDays]
  );

  const assignmentCount = groups.reduce(
    (sum, group) => sum + group.assignments.length,
    0
  );

  const subtitle = `${groups.length} project${
    groups.length === 1 ? "" : "s"
  } · ${assignmentCount} assignment${assignmentCount === 1 ? "" : "s"}`;

  if (isLoading) {
    return (
      <ChartCard title="Project Timeline">
        <div className="flex h-45 items-center justify-center">
          <Spinner className="size-6 text-primary" />
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Project Timeline"
      subtitle={subtitle}
      className="min-w-0 max-w-full p-4 sm:p-6"
    >
      {groups.length === 0 || totalDays <= 0 ? (
        <p className="py-8 text-center text-xs text-gray-400">
          No project assignments for the selected period
        </p>
      ) : (
        <div
          role="region"
          aria-label="Project assignment timeline"
          tabIndex={0}
          className="w-full overflow-x-auto overscroll-x-contain rounded outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <div style={{ minWidth: timelineMinWidth }}>
            {/* Date tick header */}
            <div className="flex items-end border-b border-gray-100 pb-1.5">
              <div
                className="sticky left-0 z-10 shrink-0 bg-white text-[9px] font-semibold uppercase tracking-wide text-gray-400"
                style={{ width: GANTT_LABEL_WIDTH }}
              >
                Project / Worker
              </div>
              <div className="relative h-3.5 min-w-0 flex-1">
                {ticks.map((tick) => (
                  <span
                    key={tick.key}
                    className="absolute top-0 whitespace-nowrap text-[9px] text-gray-400"
                    style={{
                      left: `${tick.percent}%`,
                      transform: tick.percent > 90 ? "translateX(-100%)" : undefined
                    }}
                  >
                    {tick.label}
                  </span>
                ))}
              </div>
            </div>

            {groups.map((group) => {
              const isActive = group.projectStatus === "active";
              const statusLabel = group.projectStatus || "";

              return (
                <div key={group.projectId || "unassigned"}>
                  <div className="flex items-center border-b border-gray-100 bg-gray-50">
                    <div
                      className="sticky left-0 z-10 flex shrink-0 items-center gap-1.5 bg-gray-50 py-1.5 pr-2"
                      style={{ width: GANTT_LABEL_WIDTH }}
                    >
                      <span
                        className="min-w-0 truncate text-[11px] font-bold text-gray-900"
                        title={group.projectName}
                      >
                        {group.projectName}
                      </span>
                      {statusLabel && (
                        <span
                          className={cn(
                            "max-w-20 shrink-0 truncate rounded px-1.5 py-0.5 text-[8px] font-semibold capitalize",
                            isActive
                              ? "bg-primary-100 text-primary-700"
                              : "bg-gray-200 text-gray-500"
                          )}
                          title={statusLabel}
                        >
                          {statusLabel}
                        </span>
                      )}
                    </div>
                    <div className="relative h-6 min-w-0 flex-1">
                      {ticks.map((tick) => (
                        <span
                          key={`group-guide-${tick.key}`}
                          className="absolute inset-y-0 w-px bg-gray-100"
                          style={{ left: `${tick.percent}%` }}
                        />
                      ))}
                    </div>
                  </div>
                  {group.assignments.map((assignment) => (
                    <GanttAssignmentRow
                      key={assignment.key}
                      assignment={assignment}
                      ticks={ticks}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </ChartCard>
  );
}

// ---------------------------------------------------------------------------
// Labour Rostering tab (full)
// ---------------------------------------------------------------------------

export function LabourRosteringTab({ filter }: { filter: RosteringFilter }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <EmployeeOverlapChart filter={filter} />
        <ShiftDistributionChart filter={filter} />
      </div>
      <ProjectTimelineGantt filter={filter} />
    </div>
  );
}
