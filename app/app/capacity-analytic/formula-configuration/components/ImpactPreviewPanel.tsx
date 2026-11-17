"use client";

import { useState } from "react";
import {
  Sparkles,
  X,
  ChevronDown,
  ChevronRight,
  Info,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// =====================================================================
// Types
// =====================================================================

export interface ImpactVariableRow {
  name: string;
  value: string;
  source: string;
}

export interface ImpactDetail {
  formulaReadout: string;
  variables: ImpactVariableRow[];
  capacityFormula: string;
}

export interface ImpactLineData {
  available: number;
  capacityPct: number;
  detail: ImpactDetail;
}

export interface ImpactPreviewPanelProps {
  month: string;
  onMonthChange: (month: string) => void;
  inScopeLines: string[];
  comparedLines: string[];
  onScopeChange: (inScope: string[], compared: string[]) => void;
  data: Record<string, ImpactLineData>;
  onClose: () => void;
}

// =====================================================================
// Static config
// =====================================================================

const MONTHS = [
  "Jan 2026",
  "Feb 2026",
  "Mar 2026",
  "Apr 2026",
  "May 2026",
  "Jun 2026",
  "Jul 2026",
  "Aug 2026",
  "Sep 2026",
  "Oct 2026",
  "Nov 2026",
  "Dec 2026",
];

const LINE_GROUPS = [
  {
    group: "ASCC, Main Assembly Group",
    options: ["ASCC 1", "ASCC 2", "ASCC 3", "ASCC 4", "ASCC 5"],
  },
  {
    group: "SACC, Sub Assembly Group",
    options: ["SACC 1", "SACC 2", "SACC 3", "SACC 4", "SACC 5"],
  },
];

const ALL_LINES = LINE_GROUPS.flatMap((g) => g.options);

function padLine(line: string) {
  const m = line.match(/^([A-Za-z]+)\s+(\d+)$/);
  if (!m) return line;
  return `${m[1]} ${m[2].padStart(2, "0")}`;
}

function unpadLine(line: string) {
  const m = line.match(/^([A-Za-z]+)\s+0*(\d+)$/);
  if (!m) return line;
  return `${m[1]} ${m[2]}`;
}

function statusFor(pct: number): {
  label: "Normal" | "Warning" | "NG";
  className: string;
} {
  if (pct >= 300) return { label: "NG", className: "bg-red-500" };
  if (pct >= 200) return { label: "Warning", className: "bg-amber-500" };
  return { label: "Normal", className: "bg-emerald-500" };
}

const FALLBACK_DETAIL: ImpactDetail = {
  formulaReadout: "(22 x 1 x 8) x 3,600 ÷ 50 x 0.8 = 10,138 pcs",
  variables: [
    { name: "Working days", value: "22 day", source: "Production calendar" },
    {
      name: "Shifts per day",
      value: "1 shift/day",
      source: "Shift pattern (line master)",
    },
    {
      name: "Hours per shift",
      value: "8 h/shift",
      source: "Shift pattern (line master)",
    },
    { name: "Cycle time", value: "50 s/pcs", source: "Master Part" },
    {
      name: "Efficiency",
      value: "0.8",
      source: "Line performance, last 3 months",
    },
    { name: "Loading", value: "18,000 pcs", source: "Marketing data upload" },
  ],
  capacityFormula: "Capacity % = 18,000 ÷ 10,138 x 100 = 178%",
};

function getLineData(
  data: Record<string, ImpactLineData>,
  line: string,
): ImpactLineData {
  return (
    data[line] ?? {
      available: 10138,
      capacityPct: 178,
      detail: FALLBACK_DETAIL,
    }
  );
}

// =====================================================================
// Scope popover
// =====================================================================

function ScopePopover({
  inScopeLines,
  comparedLines,
  onScopeChange,
  onClose,
}: {
  inScopeLines: string[];
  comparedLines: string[];
  onScopeChange: (inScope: string[], compared: string[]) => void;
  onClose: () => void;
}) {
  const inScopeSet = new Set(inScopeLines.map(unpadLine));
  const comparedSet = new Set(comparedLines.map(unpadLine));

  const toggleCompared = (opt: string) => {
    const next = new Set(comparedSet);
    if (next.has(opt)) next.delete(opt);
    else next.add(opt);
    onScopeChange(inScopeLines, Array.from(next).map(padLine));
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-80 rounded-xl border border-border bg-background shadow-xl">
        <div className="flex items-start gap-3 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50">
            <Layers size={16} className="text-violet-600" />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              Lines shown in the preview
            </p>
            <p className="text-xs text-muted-foreground">
              Add others to compare them side by side.
            </p>
          </div>
        </div>
        <div className="border-t border-border" />
        <div className="max-h-64 overflow-y-auto p-4">
          {LINE_GROUPS.map((g) => (
            <div key={g.group} className="mb-3 last:mb-0">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                {g.group}
              </p>
              <div className="flex flex-col gap-2">
                {g.options.map((opt) => {
                  const isInScope = inScopeSet.has(opt);
                  const isCompared = comparedSet.has(opt);
                  return (
                    <label
                      key={opt}
                      className={
                        "flex items-center gap-2.5 text-sm " +
                        (isInScope
                          ? "text-foreground"
                          : "text-foreground cursor-pointer")
                      }
                    >
                      <input
                        type="checkbox"
                        checked={isInScope || isCompared}
                        disabled={isInScope}
                        onChange={() => !isInScope && toggleCompared(opt)}
                        className={
                          "h-4 w-4 rounded accent-violet-600 " +
                          (isInScope
                            ? "accent-neutral-400 cursor-not-allowed"
                            : "cursor-pointer")
                        }
                      />
                      {opt}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-border p-3">
          <button
            onClick={() => onScopeChange(inScopeLines, [])}
            className="px-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Clear compared
          </button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-8 px-3 text-xs"
              onClick={() => {
                const remaining = ALL_LINES.filter((o) => !inScopeSet.has(o));
                onScopeChange(inScopeLines, remaining.map(padLine));
              }}
            >
              Compare all line
            </Button>
            <Button className="h-8 px-3 text-xs" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// =====================================================================
// Line row (+ expandable detail)
// =====================================================================

function LineRow({
  line,
  lineData,
  month,
  expanded,
  onToggle,
}: {
  line: string;
  lineData: ImpactLineData;
  month: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const status = statusFor(lineData.capacityPct);

  return (
    <div className={expanded ? "bg-violet-50/40" : ""}>
      <button
        onClick={onToggle}
        className="grid w-full grid-cols-[1fr_auto_auto_auto] items-center gap-3 px-4 py-3 text-left hover:bg-slate-50"
      >
        <span className="flex items-center gap-1.5 font-medium text-foreground">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {line}
        </span>
        <span className="w-20 text-right text-sm text-foreground">
          {lineData.available.toLocaleString()}
        </span>
        <span className="w-16 text-right text-sm text-foreground">
          {lineData.capacityPct}%
        </span>
        <span
          className={`inline-flex w-fit items-center justify-self-end rounded-full px-2.5 py-0.5 text-[11px] font-medium text-white ${status.className}`}
        >
          {status.label}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="font-semibold text-foreground">
              {line}, {month}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {lineData.detail.formulaReadout}
            </p>

            <div className="mt-3 space-y-1.5 text-sm">
              {lineData.detail.variables.map((v) => (
                <div
                  key={v.name}
                  className="grid grid-cols-[1fr_auto_1.4fr] gap-3"
                >
                  <span className="text-muted-foreground">{v.name}</span>
                  <span className="text-foreground">{v.value}</span>
                  <span className="text-muted-foreground">{v.source}</span>
                </div>
              ))}
            </div>

            <p className="mt-3 border-t border-border pt-3 text-sm font-medium text-foreground">
              {lineData.detail.capacityFormula}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================================================
// Panel
// =====================================================================

export function ImpactPreviewPanel({
  month,
  onMonthChange,
  inScopeLines,
  comparedLines,
  onScopeChange,
  data,
  onClose,
}: ImpactPreviewPanelProps) {
  const [monthOpen, setMonthOpen] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(false);
  const [expandedLines, setExpandedLines] = useState<Set<string>>(
    new Set([...inScopeLines.slice(-1), ...comparedLines]),
  );

  const toggleExpanded = (line: string) => {
    setExpandedLines((prev) => {
      const next = new Set(prev);
      if (next.has(line)) next.delete(line);
      else next.add(line);
      return next;
    });
  };

  const scopeLabel = `${inScopeLines.length} in scope${
    comparedLines.length > 0 ? ` + ${comparedLines.length} compared` : ""
  }`;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto border-l border-border bg-background shadow-[-8px_0_24px_-6px_rgba(0,0,0,0.15)]">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50">
              <Sparkles size={18} className="text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Impact Preview
              </h2>
              <p className="text-sm text-muted-foreground">
                Recalculates as you edit, compared with the formulas in effect
                that month.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-slate-50"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          {/* Selectors */}
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <button
                onClick={() => setMonthOpen((o) => !o)}
                className="flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-foreground"
              >
                {month}
                <ChevronDown size={14} className="text-muted-foreground" />
              </button>
              {monthOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMonthOpen(false)}
                  />
                  <div className="absolute left-0 top-[calc(100%+6px)] z-50 max-h-56 w-40 overflow-y-auto rounded-lg border border-border bg-background py-1 shadow-lg">
                    {MONTHS.map((m) => (
                      <button
                        key={m}
                        onClick={() => {
                          onMonthChange(m);
                          setMonthOpen(false);
                        }}
                        className={
                          "flex w-full items-center px-3 py-2 text-left text-sm hover:bg-slate-50 " +
                          (m === month
                            ? "font-semibold text-violet-700"
                            : "text-foreground")
                        }
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setScopeOpen((o) => !o)}
                className="flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-foreground"
              >
                {scopeLabel}
                <ChevronDown size={14} className="text-muted-foreground" />
              </button>
              {scopeOpen && (
                <ScopePopover
                  inScopeLines={inScopeLines}
                  comparedLines={comparedLines}
                  onScopeChange={onScopeChange}
                  onClose={() => setScopeOpen(false)}
                />
              )}
            </div>
          </div>

          {/* Info banner */}
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-neutral-50 p-3 text-sm text-muted-foreground">
            <Info size={16} className="mt-0.5 shrink-0" />
            <span>
              Same results as the formula in effect for {month}. Edit the
              formula to see what changes
            </span>
          </div>

          {/* Thresholds */}
          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold text-foreground">
              Thresholds
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-medium text-white">
                Normal under 200%
              </span>
              <span className="rounded-full bg-amber-500 px-2.5 py-1 text-xs font-medium text-white">
                Warning 200 to 299%
              </span>
              <span className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-medium text-white">
                NG 300% and up
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="mt-4 overflow-hidden rounded-lg border border-border">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 bg-neutral-50 px-4 py-2.5 text-xs font-medium text-muted-foreground">
              <span>Line</span>
              <span className="w-20 text-right">Available (pcs)</span>
              <span className="w-16 text-right">Capacity %</span>
              <span className="justify-self-end">Status</span>
            </div>

            <div className="bg-violet-600 px-4 py-1.5 text-xs font-semibold text-white">
              IN SCOPE
            </div>
            <div className="divide-y divide-border">
              {inScopeLines.map((line) => (
                <LineRow
                  key={line}
                  line={line}
                  lineData={getLineData(data, line)}
                  month={month}
                  expanded={expandedLines.has(line)}
                  onToggle={() => toggleExpanded(line)}
                />
              ))}
            </div>

            {comparedLines.length > 0 && (
              <>
                <div className="bg-violet-600 px-4 py-1.5 text-xs font-semibold text-white">
                  COMPARED
                </div>
                <div className="divide-y divide-border">
                  {comparedLines.map((line) => (
                    <LineRow
                      key={line}
                      line={line}
                      lineData={getLineData(data, line)}
                      month={month}
                      expanded={expandedLines.has(line)}
                      onToggle={() => toggleExpanded(line)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
