"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Terminal,
  Maximize2,
  Minimize2,
  RefreshCw,
  Loader2,
  X
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useGetWorkflowExecutionLogs } from "../hooks/useWorkflow";
import type { WorkflowExecutionLog, WorkflowLogLevel } from "../types";

const LEVEL_STYLES: Record<
  WorkflowLogLevel,
  { badge: string; dot: string; label: string }
> = {
  success: {
    badge: "bg-green-500/15 text-green-400",
    dot: "bg-green-500",
    label: "SUCCESS"
  },
  info: {
    badge: "bg-sky-500/15 text-sky-400",
    dot: "bg-sky-500",
    label: "INFO"
  },
  warning: {
    badge: "bg-amber-500/15 text-amber-400",
    dot: "bg-amber-500",
    label: "WARNING"
  },
  error: {
    badge: "bg-red-500/15 text-red-400",
    dot: "bg-red-500",
    label: "ERROR"
  }
};

function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--:--:--";
  return d.toLocaleTimeString("en-GB", { hour12: false });
}

function formatRelative(ts: number | undefined) {
  if (!ts) return "never";
  const sec = Math.floor(Math.max(0, Date.now() - ts) / 1000);
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  return `${Math.floor(min / 60)}h ago`;
}

interface ExecutionLogProps {
  workflowId: string;
  onClose?: () => void;
}

/**
 * Terminal-style console pinned to the bottom of the workflow canvas. Renders
 * the entries from GET /workflow/{id}/execution-logs, oldest first (newest at
 * the bottom, auto-scrolled) with a per-level summary footer. Fetches on open
 * and is refreshed whenever the canvas is saved; a manual refresh is also
 * available.
 */
export function ExecutionLog({ workflowId, onClose }: ExecutionLogProps) {
  const [expanded, setExpanded] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } =
    useGetWorkflowExecutionLogs(workflowId);

  const logs = data?.data;

  const items = useMemo(() => {
    const list = logs?.items ?? [];
    return [...list].sort((a, b) => {
      const byTime = a.occurred_at.localeCompare(b.occurred_at);
      return byTime !== 0 ? byTime : a.sequence - b.sequence;
    });
  }, [logs]);

  const summary = logs?.summary;
  const total = logs?.total_count ?? items.length;

  // Auto-scroll to the newest line whenever entries change while expanded.
  useEffect(() => {
    if (!expanded) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [items, expanded]);

  // Keep the "last updated" label ticking while the panel is open.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!expanded) return;
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, [expanded]);

  return (
    <div
      className={cn(
        "flex w-full flex-col overflow-hidden bg-[#0f0f1a] text-gray-200",
        isFullscreen &&
          "fixed inset-3 z-50 !h-auto !w-auto rounded-xl border border-[#2a2a3e] shadow-2xl"
      )}
    >
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center gap-2 bg-[#11111d] px-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 text-xs font-medium text-gray-200"
        >
          <Terminal className="h-4 w-4 text-green-400" />
          <span>Execution Log</span>
          <span className="text-gray-500">
            ({total} {total === 1 ? "entry" : "entries"})
          </span>
        </button>

        <div className="ml-auto flex items-center gap-1">
          <span
            className="mr-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500"
            title="Ready"
          />
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh logs"
            className="rounded p-1 text-gray-400 hover:bg-[#1a1a2e] hover:text-gray-200 disabled:opacity-50"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
            />
          </button>
          <button
            type="button"
            onClick={() => {
              setExpanded(true);
              setIsFullscreen((current) => !current);
            }}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen logs"}
            className="rounded p-1 text-gray-400 hover:bg-[#1a1a2e] hover:text-gray-200"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => {
              if (expanded && onClose) {
                onClose();
                return;
              }
              setExpanded((v) => !v);
            }}
            title={expanded && onClose ? "Close logs" : expanded ? "Collapse" : "Expand"}
            className="rounded p-1 text-gray-400 hover:bg-[#1a1a2e] hover:text-gray-200"
          >
            {expanded ? (
              <X className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <>
          <div
            ref={scrollRef}
            className={cn(
              "overflow-y-auto px-3 pb-2 font-mono text-xs leading-relaxed",
              isFullscreen ? "min-h-0 flex-1" : "h-[211px]"
            )}
          >
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-gray-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading logs...
              </div>
            ) : items.length === 0 ? (
              <div className="flex h-full items-center justify-center text-gray-600">
                No execution logs yet. Run the workflow to see output here.
              </div>
            ) : (
              items.map((log) => <LogLine key={log.id} log={log} />)
            )}
          </div>

          {/* Summary footer */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[#2a2a3e] px-3 py-1.5 text-[11px] text-gray-400">
            <SummaryStat level="success" value={summary?.success ?? 0} />
            <SummaryStat level="info" value={summary?.info ?? 0} />
            <SummaryStat level="warning" value={summary?.warning ?? 0} />
            <SummaryStat level="error" value={summary?.error ?? 0} />
            <span className="ml-auto whitespace-nowrap">
              Last updated {formatRelative(dataUpdatedAt)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryStat({
  level,
  value
}: {
  level: WorkflowLogLevel;
  value: number;
}) {
  const style = LEVEL_STYLES[level];
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", style.dot)} />
      <span className="capitalize">{level}:</span>
      <span className="text-gray-200">{value}</span>
    </span>
  );
}

function LogLine({ log }: { log: WorkflowExecutionLog }) {
  const style = LEVEL_STYLES[log.level] ?? LEVEL_STYLES.info;
  return (
    <div className="flex items-start gap-2 py-0.5">
      <span className="shrink-0 text-gray-500">
        [{formatTime(log.occurred_at)}]
      </span>
      <span
        className={cn(
          "shrink-0 rounded px-1.5 text-[10px] font-semibold uppercase leading-4",
          style.badge
        )}
      >
        {style.label}
      </span>
      <span className="break-all text-gray-200">{log.message}</span>
    </div>
  );
}
