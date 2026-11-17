"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ArrowDownWideNarrow, Inbox, List, RefreshCw, Search, ShieldAlert } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/lib/utils";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import { format2 } from "../../lib/scoring";
import type { ReportState } from "../../lib/types";
import { useActiveScoringConfiguration } from "../../scoring/use-scoring-configurations";
import { LoadState, Pager, usePageTokens } from "../cursor-pager";
import {
  PriorityBadge,
  PriorityTag,
  REPORT_STATE_LABELS,
  SafetyBadge,
  SlaBadge,
  StateBadge,
  StatusPill,
} from "../triage-badges";
import { QueueDialogs, type QueueDialogState } from "./queue-dialogs";
import {
  formatAgo,
  formatClock,
  formatDuration,
  formatWhen,
  MACHINE_STATUS_LABELS,
  slaState,
  STATE_FILTERS,
  TIME_FILTERS,
  timeFilterFrom,
  type TimeFilter,
} from "./queue-helpers";
import { CriticalityMark, ReportDrawer, type DrawerFocus } from "./report-drawer";
import { RowActionsMenu, type QueueActions } from "./row-actions";
import {
  useBreakdownReports,
  useEscalateReport,
  useQueueSummary,
  useRestoreReport,
  useStartReport,
  type PriorityFilter,
  type QueueReport,
} from "./use-breakdown-reports";

const TILE_COLORS: Record<Exclude<PriorityFilter, "all">, string> = {
  P1: "border-l-red-600",
  P2: "border-l-amber-500",
  P3: "border-l-blue-600",
  safety: "border-l-red-600",
};

function SummaryTile({
  filter,
  active,
  label,
  count,
  hint,
  onToggle,
}: {
  filter: Exclude<PriorityFilter, "all">;
  active: boolean;
  label: ReactNode;
  count: number | undefined;
  hint: ReactNode;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={cn(
        "rounded-xl border border-l-4 border-gray-200 bg-white px-4 py-3.5 text-left transition hover:border-primary-300",
        TILE_COLORS[filter],
        active && "ring-2 ring-primary-300"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        {label}
        <span className="text-xs text-gray-500">{active ? "Filter on" : "View"}</span>
      </div>
      <div className="mt-1.5 font-mono text-[28px] font-bold leading-tight tracking-tight">{count ?? "—"}</div>
      <div className="mt-1.5 text-[12.5px] leading-snug text-gray-600">{hint}</div>
    </button>
  );
}

export function SupervisorQueue() {
  const setBreadcrumbs = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);
  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [stateFilter, setStateFilter] = useState<"all" | ReportState>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("today");
  const [pageSize, setPageSize] = useState(20);
  const search = useDebouncedValue(query.trim(), 350);
  // The window start is fixed per filter choice so the query key stays stable between renders.
  const [reportedFrom, setReportedFrom] = useState(() => timeFilterFrom("today"));
  const paging = usePageTokens(`${search}|${priorityFilter}|${stateFilter}|${reportedFrom}|${pageSize}`);
  const list = useBreakdownReports({
    search: search || undefined,
    priority: priorityFilter === "all" ? undefined : priorityFilter,
    state: stateFilter === "all" ? undefined : stateFilter,
    reported_from: reportedFrom,
    page_size: pageSize,
    page_token: paging.token || undefined,
  });
  const summary = useQueueSummary();
  const active = useActiveScoringConfiguration();
  const escalate = useEscalateReport();
  const start = useStartReport();
  const restore = useRestoreReport();

  // `?report=<id>` (e.g. from AI Insights) opens that report's detail drawer.
  const reportParam = useSearchParams().get("report");
  const [selected, setSelected] = useState<{ id: string; initial?: QueueReport; focus: DrawerFocus; key: number } | null>(() =>
    reportParam ? { id: reportParam, focus: null, key: 0 } : null
  );
  const [dialog, setDialog] = useState<QueueDialogState>(null);

  useEffect(() => {
    setBreadcrumbs([{ title: "Asset Management" }, { title: "Breakdown Triage" }, { title: "Supervisor Queue" }]);
    return clearBreadcrumbs;
  }, [setBreadcrumbs, clearBreadcrumbs]);

  const changeTime = (value: TimeFilter) => {
    setTimeFilter(value);
    setReportedFrom(timeFilterFrom(value));
  };
  const dirty = Boolean(query || priorityFilter !== "all" || stateFilter !== "all" || timeFilter !== "today");
  const resetFilters = () => {
    setQuery("");
    setPriorityFilter("all");
    setStateFilter("all");
    changeTime("today");
  };

  const openDetail = useCallback((report: QueueReport, focus: DrawerFocus = null) => {
    setSelected((current) => ({ id: report.id, initial: report, focus, key: (current?.key ?? 0) + 1 }));
  }, []);
  const closeDetail = useCallback(() => setSelected(null), []);

  const actions: QueueActions = {
    busy: escalate.isPending || start.isPending || restore.isPending,
    openDetail: (report) => openDetail(report),
    openDialog: (kind, report, caseId) => setDialog({ kind, report, caseId }),
    escalate: (report) =>
      escalate.mutate({ id: report.id }, { onSuccess: () => toast.success(`${report.code} escalated to the Maintenance Manager`) }),
    start: (report) => start.mutate(report.id, { onSuccess: () => toast.success(`Work started on ${report.code}`) }),
    restore: (report) => restore.mutate(report.id, { onSuccess: () => toast.success(`${report.code} restored to the queue`) }),
    addNote: (report) => openDetail(report, "notes"),
    showHistory: (report) => openDetail(report, "activity"),
  };

  const slaMinutes = active.data?.config.slaMinutes;
  const remainingText = (report: QueueReport) => {
    const sla = slaState(report, slaMinutes);
    if (sla.kind === "overdue") return <span className="text-red-600">overdue {sla.minutes} min</span>;
    return sla.kind === "remaining" ? `${formatDuration(sla.minutes)} left` : formatAgo(report.reportedAt);
  };
  const counts = summary.data?.counts;
  const toggleTile = (filter: Exclude<PriorityFilter, "all">) =>
    setPriorityFilter((current) => (current === filter ? "all" : filter));
  const { nextP1, nextP2, topSafety, scheduledP3, unscheduledP3 } = summary.data ?? {};

  const chipCounts = list.data?.priorityCounts;
  const chips: [PriorityFilter, string, number | undefined][] = [
    ["all", "All", chipCounts?.all],
    ["P1", "P1", chipCounts?.P1],
    ["P2", "P2", chipCounts?.P2],
    ["P3", "P3", chipCounts?.P3],
    ["safety", "Safety", chipCounts?.safety],
  ];
  const rows = list.data?.items ?? [];

  const refresh = () => {
    void Promise.all([list.refetch(), summary.refetch()]).then(() => toast.success("Queue refreshed"));
  };

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        title="Supervisor Priority Queue"
        subtitle="All breakdown reports, sorted by highest priority, then oldest report. Open a report to review the evidence and score, or change its priority with a reason."
      />

      <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
        <SummaryTile
          filter="P1"
          active={priorityFilter === "P1"}
          label={<PriorityTag priority="P1" />}
          count={counts?.P1}
          hint={nextP1 ? <>Respond next: <b>{nextP1.asset.name || nextP1.code}</b>, {remainingText(nextP1)}</> : "All P1s have been responded to"}
          onToggle={() => toggleTile("P1")}
        />
        <SummaryTile
          filter="P2"
          active={priorityFilter === "P2"}
          label={<PriorityTag priority="P2" />}
          count={counts?.P2}
          hint={nextP2 ? <>Awaiting response: <b>{nextP2.asset.name || nextP2.code}</b>, {remainingText(nextP2)}</> : "All P2s have been responded to"}
          onToggle={() => toggleTile("P2")}
        />
        <SummaryTile
          filter="P3"
          active={priorityFilter === "P3"}
          label={<PriorityTag priority="P3" />}
          count={counts?.P3}
          hint={
            scheduledP3 != null && unscheduledP3 != null
              ? `${scheduledP3} scheduled, ${unscheduledP3} not yet scheduled`
              : "Schedule within the response target"
          }
          onToggle={() => toggleTile("P3")}
        />
        <SummaryTile
          filter="safety"
          active={priorityFilter === "safety"}
          label={<StatusPill tone="red" icon={ShieldAlert}>Safety</StatusPill>}
          count={counts?.safety}
          hint={
            topSafety ? (
              <>
                <b>{topSafety.asset.name || topSafety.code}</b> ·{" "}
                {topSafety.state === "new"
                  ? "awaiting response"
                  : `${REPORT_STATE_LABELS[topSafety.state].toLowerCase()} by ${topSafety.technician.name}`}
              </>
            ) : (
              "No hazardous reports"
            )
          }
          onToggle={() => toggleTile("safety")}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center gap-2.5 border-b border-gray-200 px-4 py-3.5">
          <div className="relative min-w-64 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search code, work order, asset, technician, or description"
              aria-label="Search reports"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {chips.map(([value, label, count]) => (
              <button
                key={value}
                type="button"
                onClick={() => setPriorityFilter(value)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-[13px] font-medium",
                  priorityFilter === value
                    ? "border-primary-300 bg-primary-50 text-primary-700"
                    : "border-gray-200 bg-white text-gray-700 hover:border-primary-200"
                )}
              >
                {label}
                {count != null && (
                  <span className={cn("text-[11.5px]", priorityFilter === value ? "text-primary-600" : "text-gray-500")}>{count}</span>
                )}
              </button>
            ))}
          </div>
          <Select value={stateFilter} onValueChange={(value) => setStateFilter(value as "all" | ReportState)}>
            <SelectTrigger className="w-40" aria-label="Filter status"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATE_FILTERS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={timeFilter} onValueChange={(value) => changeTime(value as TimeFilter)}>
            <SelectTrigger className="w-36" aria-label="Filter time"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIME_FILTERS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" aria-label="Refresh queue" disabled={list.isFetching} onClick={refresh}>
            <RefreshCw className={cn("h-4 w-4", list.isFetching && "animate-spin")} />
          </Button>
        </div>

        {list.isLoading || (list.isError && !list.data) ? (
          <LoadState error={list.isError} onRetry={() => list.refetch()} />
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-primary-50 text-primary-600"><Inbox className="h-6 w-6" /></span>
            <h4 className="mt-2 text-base font-semibold">No breakdowns need review.</h4>
            <p className="text-sm text-gray-500">No reports match your filters.</p>
            <Button variant="outline" className="mt-2" onClick={resetFilters}>
              <List className="h-4 w-4" />{dirty ? "Reset filters" : "View all reports"}
            </Button>
          </div>
        ) : (
          <div className={cn("transition-opacity", list.isFetching && "opacity-60")}>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead>Priority</TableHead>
                  <TableHead>Report</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Safety</TableHead>
                  <TableHead>Technician & status</TableHead>
                  <TableHead>Last action</TableHead>
                  <TableHead>Response target</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((report) => (
                  <TableRow
                    key={report.id}
                    onClick={() => openDetail(report)}
                    className={cn("cursor-pointer", selected?.id === report.id && "bg-primary-50 hover:bg-primary-50")}
                  >
                    <TableCell className="align-top">
                      <PriorityBadge report={report} />
                      <span className="mt-1 block font-mono text-xs text-gray-500">
                        {report.score != null ? format2(report.score) : "—"}
                        {report.override && " · override"}
                      </span>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="font-medium text-primary-700">{report.code}</div>
                      <div className="max-w-60 truncate">{report.description}</div>
                      <div className="text-xs text-gray-500">
                        {formatClock(report.reportedAt)} · {formatAgo(report.reportedAt)} · {MACHINE_STATUS_LABELS[report.machineStatus]}
                      </div>
                    </TableCell>
                    <TableCell className="min-w-48 align-top">
                      <div className="flex items-center gap-2">
                        {report.asset.criticality && <CriticalityMark criticality={report.asset.criticality} />}
                        <div>
                          <div className="font-medium">{report.asset.name || "—"}</div>
                          <div className="text-xs text-gray-500">{[report.asset.code, report.asset.line].filter(Boolean).join(" · ")}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-top"><SafetyBadge report={report} /></TableCell>
                    <TableCell className="align-top">
                      <div className="font-medium">{report.technician.name}</div>
                      <div className="mt-1"><StateBadge state={report.state} /></div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="max-w-44 truncate">{report.lastEvent?.text ?? "—"}</div>
                      <div className="font-mono text-xs text-gray-500">{report.lastEvent ? formatWhen(report.lastEvent.at) : ""}</div>
                    </TableCell>
                    <TableCell className="align-top"><SlaBadge report={report} /></TableCell>
                    <TableCell className="text-right align-top">
                      <RowActionsMenu report={report} actions={actions} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-gray-200 px-4 py-3 text-[12.5px] text-gray-500">
          <div className="flex flex-wrap items-center gap-3">
            <Pager
              page={paging.page}
              pageSize={pageSize}
              shown={rows.length}
              total={list.data?.totalCount ?? 0}
              hasNext={Boolean(list.data?.nextPageToken)}
              loading={list.isFetching}
              onPrev={paging.prev}
              onNext={() => list.data?.nextPageToken && paging.next(list.data.nextPageToken)}
              onPageSizeChange={setPageSize}
            />
            {dirty && (
              <button type="button" className="font-medium text-primary-700 hover:underline" onClick={resetFilters}>Reset filters</button>
            )}
          </div>
          <span className="flex items-center gap-1.5"><ArrowDownWideNarrow className="h-4 w-4" />Sorted by priority, then oldest report</span>
        </div>
      </div>

      {selected && (
        <ReportDrawer
          key={`${selected.id}-${selected.key}`}
          reportId={selected.id}
          initial={selected.initial}
          actions={actions}
          focus={selected.focus}
          onClose={closeDetail}
        />
      )}
      <QueueDialogs dialog={dialog} onClose={() => setDialog(null)} />
    </div>
  );
}
