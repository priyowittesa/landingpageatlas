"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlarmClock,
  AlertOctagon,
  ArrowDownWideNarrow,
  Box,
  Boxes,
  CheckCircle2,
  CircleSlash,
  Cpu,
  Database,
  Download,
  History,
  Lightbulb,
  Loader2,
  Lock,
  RefreshCw,
  RotateCcw,
  Search,
  SearchX,
  Send,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import { LoadState, PAGE_SIZE_OPTIONS, Pager, usePageTokens } from "../components/cursor-pager";
import { SeverityBadge, StatusPill } from "../components/triage-badges";
import type { AiInsight, InsightSeverity, InsightStatus, InsightType } from "../lib/types";
import { HISTORY_EVENTS, INSIGHT_TYPES } from "./insight-data";
import { AskAiDialog } from "./ask-ai-dialog";
import { AcceptInsightDialog, DismissInsightDialog } from "./insight-dialogs";
import { InsightDetail } from "./insight-detail";
import { InsightStatusBadge, InsightTypeBadge, SnoozeMenu, useReopen } from "./insight-shared";
import {
  EVENT_TYPES,
  useAiInsightEvents,
  useAiInsights,
  useAiInsightSummary,
  useAskAi,
  useSyncSchedule,
  type AiInsightEvent,
} from "./use-ai-insights";

const SCORING_HREF = "/app/asset-management/breakdown-triage/scoring";
/** "Ask AI" chat is hidden for now; flip to re-enable the header button and dialog. */
const ASK_AI_ENABLED = false;
const ACTION_ICONS: Record<AiInsight["kind"], LucideIcon> = {
  purchase: ShoppingCart,
  config: SlidersHorizontal,
  data: Send,
  inspect: UserPlus,
};
const STATUS_OPTIONS: { value: InsightStatus | "all"; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "snoozed", label: "Snoozed" },
  { value: "accepted", label: "Accepted" },
  { value: "dismissed", label: "Dismissed" },
  { value: "all", label: "All statuses" },
];

function StatCard({ icon: Icon, label, value, caption, tone }: { icon: LucideIcon; label: string; value: number; caption: string; tone?: "red" | "green" }) {
  return (
    <div className="flex items-start gap-3.5 rounded-xl border border-gray-200 bg-white px-4.5 py-4">
      <span
        className={cn(
          "grid h-9.5 w-9.5 shrink-0 place-items-center rounded-lg",
          tone === "red" ? "bg-red-50 text-red-600" : tone === "green" ? "bg-green-50 text-green-700" : "bg-primary-100 text-primary-600"
        )}
      >
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div>
        <div className="text-[13px] text-gray-500">{label}</div>
        <div className="mt-0.5 text-2xl font-bold tracking-tight text-gray-950">{value}</div>
        <div className="mt-0.5 text-xs text-gray-500">{caption}</div>
      </div>
    </div>
  );
}

function EmptyState({ title, description, onReset }: { title: string; description: string; onReset?: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-gray-100 text-gray-500"><SearchX className="h-5 w-5" /></span>
      <h4 className="mt-3 text-base font-semibold text-gray-900">{title}</h4>
      <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>
      {onReset && (
        <Button variant="outline" className="mt-4" onClick={onReset}>
          <RotateCcw className="h-4 w-4" />
          Reset filters
        </Button>
      )}
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div className="relative min-w-60 flex-1 sm:max-w-sm">
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={placeholder} className="pl-9" />
    </div>
  );
}

function InsightCard({
  insight,
  assetLabel,
  onOpen,
  onAccept,
  onDismiss,
  onReopen,
}: {
  insight: AiInsight;
  assetLabel?: string;
  onOpen: () => void;
  onAccept: () => void;
  onDismiss: () => void;
  onReopen: () => void;
}) {
  const open = insight.status === "open";
  const ActionIcon = ACTION_ICONS[insight.kind];
  const accent = { anomaly: "border-l-red-500", prediction: "border-l-blue-500", recommendation: "border-l-primary-500" }[insight.type];
  const stop = (handler: () => void) => (event: React.MouseEvent) => {
    event.stopPropagation();
    handler();
  };
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onOpen();
        }
      }}
      className={cn(
        "flex cursor-pointer flex-col gap-3 rounded-xl border border-l-4 border-gray-200 bg-white p-4 text-left transition-colors hover:border-primary-300 focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:outline-none",
        accent,
        !open && "bg-gray-50/60"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <InsightTypeBadge type={insight.type} />
        <SeverityBadge severity={insight.severity} />
        <InsightStatusBadge insight={insight} />
        <span className="ml-auto text-xs text-gray-500">{insight.createdAt}</span>
      </div>
      <div>
        <div className={cn("text-[15px] font-semibold leading-snug", open ? "text-gray-950" : "text-gray-600")}>{insight.title}</div>
        <p className="mt-1 line-clamp-3 text-[13.5px] leading-5 text-gray-600">{insight.description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-gray-500">
        {assetLabel && (
          <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 font-medium text-gray-700">
            <Box className="h-3 w-3" />
            {assetLabel}
          </span>
        )}
        <span className="inline-flex items-center gap-1"><Database className="h-3 w-3" />{insight.basis}</span>
      </div>
      {open ? (
        <div className="mt-auto flex flex-wrap gap-2 border-t border-gray-100 pt-3">
          {insight.kind === "config" ? (
            <Button asChild size="sm" variant="outline" className="border-primary-200 text-primary-700 hover:bg-primary-50" onClick={(event) => event.stopPropagation()}>
              <Link href={SCORING_HREF}>
                <ActionIcon className="h-3.5 w-3.5" />
                {insight.actionLabel}
              </Link>
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="border-primary-200 text-primary-700 hover:bg-primary-50" onClick={stop(onAccept)}>
              <ActionIcon className="h-3.5 w-3.5" />
              {insight.actionLabel}
            </Button>
          )}
          <SnoozeMenu insight={insight}>
            <Button size="sm" variant="ghost">
              <AlarmClock className="h-3.5 w-3.5" />
              Snooze
            </Button>
          </SnoozeMenu>
          <Button size="sm" variant="ghost" onClick={stop(onDismiss)}>
            Dismiss
          </Button>
        </div>
      ) : (
        <div className="mt-auto flex items-start gap-2 border-t border-gray-100 pt-3 text-[13px] text-gray-600">
          {insight.status === "accepted" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
          ) : insight.status === "snoozed" ? (
            <AlarmClock className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <CircleSlash className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span className="flex-1">{insight.outcome}</span>
          <button type="button" className="shrink-0 font-medium text-primary-700 hover:underline" onClick={stop(onReopen)}>
            Reopen
          </button>
        </div>
      )}
    </div>
  );
}

export function AiInsights() {
  const setBreadcrumbs = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);
  const { reopen } = useReopen();
  const askAi = useAskAi();
  const syncSchedule = useSyncSchedule();

  const [tab, setTab] = useState<"list" | "history">("list");
  const [query, setQuery] = useState("");
  const [type, setType] = useState<InsightType | "all">("all");
  const [severity, setSeverity] = useState<InsightSeverity | "all">("all");
  const [status, setStatus] = useState<InsightStatus | "all">("open");
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyEvent, setHistoryEvent] = useState("all");
  const [historyPageSize, setHistoryPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [selected, setSelected] = useState<{ id: string; insight?: AiInsight } | null>(null);
  const [accepting, setAccepting] = useState<AiInsight | null>(null);
  const [dismissing, setDismissing] = useState<AiInsight | null>(null);
  const [askOpen, setAskOpen] = useState(false);

  useEffect(() => {
    setBreadcrumbs([{ title: "Asset Management" }, { title: "Breakdown Triage" }, { title: "AI Insights" }]);
    return clearBreadcrumbs;
  }, [setBreadcrumbs, clearBreadcrumbs]);

  const search = useDebouncedValue(query.trim(), 350);
  const listPaging = usePageTokens(JSON.stringify([search, type, severity, status, pageSize]));
  const list = useAiInsights({
    search: search || undefined,
    type: type === "all" ? undefined : type,
    severity: severity === "all" ? undefined : severity.toLowerCase(),
    status: status === "all" ? undefined : status,
    page_size: pageSize,
    page_token: listPaging.token || undefined,
  });
  const summary = useAiInsightSummary().data;
  const visible = list.data?.items ?? [];
  const typeCounts = list.data?.typeCounts ?? {};
  const typeTotal = Object.values(typeCounts).reduce((sum, count) => sum + (count ?? 0), 0);

  const assetLabel = (insight: AiInsight) =>
    insight.assetCode ? [insight.assetCode, insight.assetName].filter(Boolean).join(" · ") : undefined;

  const filtersDirty = Boolean(query) || type !== "all" || severity !== "all" || status !== "open";
  const resetFilters = () => {
    setQuery("");
    setType("all");
    setSeverity("all");
    setStatus("open");
  };

  const historySearch = useDebouncedValue(historyQuery.trim(), 350);
  const historyPaging = usePageTokens(JSON.stringify([historySearch, historyEvent, historyPageSize]));
  const events = useAiInsightEvents(
    {
      search: historySearch || undefined,
      event_type: historyEvent === "all" ? undefined : historyEvent,
      page_size: historyPageSize,
      page_token: historyPaging.token || undefined,
    },
    tab === "history"
  );
  const filteredHistory = events.data?.items ?? [];

  const exportHistory = () => {
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const rows = [
      ["When", "Event", "Insight Code", "Insight", "Asset", "By", "Details"],
      ...filteredHistory.map((event) => [event.at, event.event, event.insightCode, event.insightTitle, event.assetCode, event.by, event.detail]),
    ];
    const url = URL.createObjectURL(new Blob([rows.map((row) => row.map(escape).join(",")).join("\n")], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "atlas-ai-insight-history.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success(`${filteredHistory.length} event${filteredHistory.length === 1 ? "" : "s"} exported`);
  };

  const tabButton = (value: "list" | "history", icon: LucideIcon, label: string, count: ReactNode) => {
    const Icon = icon;
    return (
      <button
        type="button"
        role="tab"
        aria-selected={tab === value}
        onClick={() => setTab(value)}
        className={cn(
          "-mb-px inline-flex items-center gap-2 border-b-2 px-1 pb-2.5 text-sm font-medium transition-colors",
          tab === value ? "border-primary-600 text-primary-700" : "border-transparent text-gray-500 hover:text-gray-800"
        )}
      >
        <Icon className="h-4 w-4" />
        {label}
        {count != null && (
          <span className={cn("rounded-full px-2 py-0.5 text-xs", tab === value ? "bg-primary-50 text-primary-700" : "bg-gray-100 text-gray-600")}>{count}</span>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-5 pb-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em] text-gray-950">AI Insights</h1>
          <p className="mt-1 text-sm leading-5 text-gray-500">
            Patterns Atlas AI finds in breakdown history, open reports, and spare-part stock. Every insight shows its evidence, and nothing changes until you accept it.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => syncSchedule.mutate()} disabled={syncSchedule.isPending}>
            {syncSchedule.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Sync Schedule
          </Button>
          {ASK_AI_ENABLED && (
            <Button onClick={() => setAskOpen(true)}>
              <Sparkles className="h-4 w-4" />
              Ask AI
            </Button>
          )}
        </div>
      </header>

      <div role="tablist" aria-label="AI insights views" className="flex gap-6 border-b border-gray-200">
        {tabButton("list", Lightbulb, "Insights", `${summary?.open ?? 0} open`)}
        {tabButton("history", History, "History", events.data?.totalCount || null)}
      </div>

      {tab === "list" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Lightbulb} label="Open insights" value={summary?.open ?? 0} caption="Waiting for review" />
            <StatCard icon={AlertOctagon} label="High severity" value={summary?.highSeverity ?? 0} caption="Among open insights" tone="red" />
            <StatCard icon={Boxes} label="Assets affected" value={summary?.assetsAffected ?? 0} caption="Flagged by open insights" />
            <StatCard icon={CheckCircle2} label="Accepted" value={summary?.accepted ?? 0} caption="Last 30 days" tone="green" />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="flex flex-wrap items-center gap-3 p-4">
              <SearchBox value={query} onChange={setQuery} placeholder="Search insight, asset code, or name" />
              <div className="flex flex-wrap gap-1.5">
                {(["all", "anomaly", "prediction", "recommendation"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={type === value}
                    onClick={() => setType(value)}
                    className={cn(
                      "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium whitespace-nowrap transition-colors",
                      type === value ? "border-primary-300 bg-primary-50 text-primary-700" : "border-gray-200 bg-white text-gray-700 hover:border-primary-200"
                    )}
                  >
                    {value === "all" ? "All" : INSIGHT_TYPES[value].label}
                    <span className={cn("text-[11.5px]", type === value ? "text-primary-600" : "text-gray-500")}>
                      {value === "all" ? typeTotal : (typeCounts[value] ?? 0)}
                    </span>
                  </button>
                ))}
              </div>
              <div className="ml-auto flex gap-2">
                <Select value={severity} onValueChange={(value) => setSeverity(value as InsightSeverity | "all")}>
                  <SelectTrigger className="w-40" aria-label="Filter severity"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All severities</SelectItem>
                    {(["High", "Medium", "Low"] as const).map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={status} onValueChange={(value) => setStatus(value as InsightStatus | "all")}>
                  <SelectTrigger className="w-36" aria-label="Filter status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className={cn("px-4 pb-4 transition-opacity", list.isFetching && !list.isLoading && "opacity-60")}>
              {list.isLoading || (list.isError && !list.data) ? (
                <LoadState error={list.isError} onRetry={() => list.refetch()} />
              ) : visible.length ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {visible.map((insight) => (
                    <InsightCard
                      key={insight.id}
                      insight={insight}
                      assetLabel={assetLabel(insight)}
                      onOpen={() => setSelected({ id: insight.id, insight })}
                      onAccept={() => setAccepting(insight)}
                      onDismiss={() => setDismissing(insight)}
                      onReopen={() => reopen(insight)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No matching insights"
                  description={
                    !filtersDirty
                      ? "All insights have been handled. New ones appear after the next analysis run."
                      : "Change your search or filters."
                  }
                  onReset={filtersDirty ? resetFilters : undefined}
                />
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
              <span className="inline-flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5"><ArrowDownWideNarrow className="h-3.5 w-3.5" />Sorted by status, then severity</span>
                {filtersDirty && (
                  <button type="button" className="font-medium text-primary-700 hover:underline" onClick={resetFilters}>Reset filters</button>
                )}
              </span>
              <Pager
                page={listPaging.page}
                pageSize={pageSize}
                shown={visible.length}
                total={list.data?.totalCount ?? 0}
                hasNext={Boolean(list.data?.nextPageToken)}
                loading={list.isFetching}
                onPrev={listPaging.prev}
                onNext={() => list.data?.nextPageToken && listPaging.next(list.data.nextPageToken)}
                onPageSizeChange={setPageSize}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="flex flex-wrap items-center gap-3 p-4">
            <SearchBox value={historyQuery} onChange={setHistoryQuery} placeholder="Search insight, asset, person, or detail" />
            <Select value={historyEvent} onValueChange={setHistoryEvent}>
              <SelectTrigger className="w-40" aria-label="Filter event"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All events</SelectItem>
                {Object.entries(EVENT_TYPES)
                  .filter(([value]) => ASK_AI_ENABLED || value !== "asked_ai")
                  .map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" className="ml-auto" disabled={!filteredHistory.length} onClick={exportHistory}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
          {events.isLoading || (events.isError && !events.data) ? (
            <LoadState error={events.isError} onRetry={() => events.refetch()} />
          ) : filteredHistory.length ? (
            <div className={cn("transition-opacity", events.isFetching && "opacity-60")}>
              <HistoryTable events={filteredHistory} onOpen={(id) => setSelected({ id })} />
            </div>
          ) : (
            <EmptyState
              title="No matching events"
              description="Change your search or event filter."
              onReset={() => {
                setHistoryQuery("");
                setHistoryEvent("all");
              }}
            />
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" />Logged automatically · entries can’t be edited or deleted</span>
            <Pager
              page={historyPaging.page}
              pageSize={historyPageSize}
              shown={filteredHistory.length}
              total={events.data?.totalCount ?? 0}
              hasNext={Boolean(events.data?.nextPageToken)}
              loading={events.isFetching}
              onPrev={historyPaging.prev}
              onNext={() => events.data?.nextPageToken && historyPaging.next(events.data.nextPageToken)}
              onPageSizeChange={setHistoryPageSize}
            />
          </div>
        </div>
      )}

      <InsightDetail
        insightId={selected?.id ?? null}
        initial={selected?.insight}
        onClose={() => setSelected(null)}
        onAccept={setAccepting}
        onDismiss={setDismissing}
      />
      <AcceptInsightDialog insight={accepting} onClose={() => setAccepting(null)} />
      <DismissInsightDialog insight={dismissing} onClose={() => setDismissing(null)} />
      {ASK_AI_ENABLED && (
        <AskAiDialog open={askOpen} onOpenChange={setAskOpen} onAsk={(question) => askAi.mutate(question)} />
      )}
    </div>
  );
}

function HistoryTable({ events, onOpen }: { events: AiInsightEvent[]; onOpen: (id: string) => void }) {
  return (
    <div className="overflow-x-auto border-t border-gray-100">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500">
          <tr>
            <th className="px-4 py-2.5">When</th>
            <th className="px-4 py-2.5">Event</th>
            <th className="px-4 py-2.5">Insight</th>
            <th className="px-4 py-2.5">By</th>
            <th className="px-4 py-2.5">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {events.map((event) => {
            const insightId = event.insightId;
            const badge = HISTORY_EVENTS[event.event] ?? { tone: "muted" as const, icon: Lightbulb };
            return (
              <tr
                key={event.id}
                className={cn(insightId && "cursor-pointer hover:bg-gray-50")}
                onClick={insightId ? () => onOpen(insightId) : undefined}
              >
                <td className="px-4 py-3 font-mono text-[12.5px] whitespace-nowrap text-gray-700">{event.at}</td>
                <td className="px-4 py-3"><StatusPill tone={badge.tone} icon={badge.icon}>{event.event}</StatusPill></td>
                <td className="px-4 py-3">
                  {insightId ? (
                    <>
                      <div className="max-w-sm truncate font-medium text-gray-900">{event.insightTitle || event.insightCode || "—"}</div>
                      <div className="text-xs text-gray-500">{[event.insightCode, event.assetCode].filter(Boolean).join(" · ")}</div>
                    </>
                  ) : (
                    <span className="text-xs text-gray-500">Ask AI</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                  {event.by === "Atlas AI" ? <span className="inline-flex items-center gap-1.5"><Cpu className="h-3.5 w-3.5" />Atlas AI</span> : event.by}
                </td>
                <td className="px-4 py-3">
                  <div className="max-w-xs truncate text-gray-600" title={event.detail}>
                    {event.detail ? event.detail[0].toUpperCase() + event.detail.slice(1) : "—"}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
