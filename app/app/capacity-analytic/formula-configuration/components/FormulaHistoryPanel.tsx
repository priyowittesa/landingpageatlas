"use client";

import { useState } from "react";
import { History, X } from "lucide-react";

// ---------- Types ----------

export type PillKind = "variable" | "constant" | "operator";
export type PillDiff = "added" | "removed";

export interface FormulaPillItem {
  kind: PillKind;
  label: string;
  unit?: string;
}

export interface FormulaVersionEntry {
  version: string;
  title: string;
  inEffect?: boolean;
  since: string;
  updatedBy: string;
  updatedDate: string;
  pills: FormulaPillItem[];
}

export interface FormulaHistoryPanelProps {
  scope: string;
  versions: FormulaVersionEntry[];
  onClose: () => void;
}

// ---------- Pill rendering ----------

function Pill({ item, diff }: { item: FormulaPillItem; diff?: PillDiff }) {
  if (diff === "added") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
        {item.label}
        {item.unit && (
          <span className="text-xs font-normal text-emerald-500">
            {item.unit}
          </span>
        )}
      </span>
    );
  }

  if (diff === "removed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-red-400 bg-white px-3 py-2 text-sm font-semibold text-red-600">
        {item.label}
        {item.unit && (
          <span className="text-xs font-normal text-red-400">{item.unit}</span>
        )}
      </span>
    );
  }

  if (item.kind === "operator") {
    return (
      <span className="inline-flex items-center justify-center rounded-lg bg-neutral-100 px-3 py-2 text-sm font-bold text-neutral-600">
        {item.label}
      </span>
    );
  }

  if (item.kind === "constant") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground">
        {item.label}
        {item.unit && (
          <span className="text-xs text-neutral-400">{item.unit}</span>
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-violet-100 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-900">
      {item.label}
      {item.unit && (
        <span className="text-xs text-neutral-400">{item.unit}</span>
      )}
    </span>
  );
}

export function PillRow({
  pills,
  diffAgainst,
  diffAs,
}: {
  pills: FormulaPillItem[];
  diffAgainst?: FormulaPillItem[];
  diffAs?: PillDiff;
}) {
  const otherLabels = diffAgainst
    ? new Set(diffAgainst.map((p) => p.label))
    : null;

  return (
    <div className="flex flex-wrap gap-2">
      {pills.map((pill, i) => {
        const diff =
          otherLabels && !otherLabels.has(pill.label) ? diffAs : undefined;
        return <Pill key={`${pill.label}-${i}`} item={pill} diff={diff} />;
      })}
    </div>
  );
}

// ---------- Single version block ----------

function VersionBlock({
  entry,
  currentEntry,
}: {
  entry: FormulaVersionEntry;
  currentEntry: FormulaVersionEntry;
}) {
  const [comparing, setComparing] = useState(false);
  const isCurrent = entry === currentEntry;

  return (
    <div className="border-b border-border pb-5 last:border-b-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-foreground">{entry.title}</span>
        <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-xs font-medium text-neutral-500">
          {entry.version}
        </span>
        {entry.inEffect && (
          <>
            <span className="inline-flex items-center rounded-full bg-emerald-500 px-2.5 py-0.5 text-[11px] font-medium text-white">
              Active
            </span>
            <span className="text-xs font-medium text-emerald-600">
              In effect now
            </span>
          </>
        )}
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        Since {entry.since} &nbsp;Updated by {entry.updatedBy} on{" "}
        {entry.updatedDate}
      </p>

      {!comparing && (
        <div className="mt-3">
          <PillRow pills={entry.pills} />
        </div>
      )}

      {comparing && (
        <div className="mt-3 flex flex-col gap-4">
          <div className="rounded-xl border border-border p-3">
            <p className="text-xs font-medium text-muted-foreground">
              In effect
              <br />
              <span className="text-foreground">{currentEntry.title}</span>{" "}
              <span className="text-foreground">{currentEntry.version}</span>
            </p>
            <div className="mt-2">
              <PillRow
                pills={currentEntry.pills}
                diffAgainst={entry.pills}
                diffAs="removed"
              />
            </div>
          </div>

          <div className="rounded-xl border border-border p-3">
            <p className="text-xs font-medium text-muted-foreground">
              This one
              <br />
              <span className="text-foreground">{entry.version}</span>
            </p>
            <div className="mt-2">
              <PillRow
                pills={entry.pills}
                diffAgainst={currentEntry.pills}
                diffAs="added"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs border border-emerald-300 bg-emerald-50" />
              Added
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs border border-red-400 bg-white" />
              Removed
            </span>
          </div>
        </div>
      )}

      {!isCurrent && (
        <button
          onClick={() => setComparing((c) => !c)}
          className="mt-4 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-slate-50"
        >
          {comparing ? "Hide comparison" : "Compare with in effect"}
        </button>
      )}
    </div>
  );
}

// ---------- Panel ----------

export function FormulaHistoryPanel({
  scope,
  versions,
  onClose,
}: FormulaHistoryPanelProps) {
  const currentEntry = versions.find((v) => v.inEffect) ?? versions[0];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto border-l border-border bg-background shadow-[-8px_0_24px_-6px_rgba(0,0,0,0.15)]">
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50">
              <History size={18} className="text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                History: {scope}
              </h2>
              <p className="text-sm text-muted-foreground">
                {versions.length} versions. In effect now: {scope}{" "}
                {currentEntry.version}.
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

        <div className="flex flex-col gap-5 p-5">
          {versions.map((entry) => (
            <VersionBlock
              key={entry.version}
              entry={entry}
              currentEntry={currentEntry}
            />
          ))}
        </div>
      </div>
    </>
  );
}
