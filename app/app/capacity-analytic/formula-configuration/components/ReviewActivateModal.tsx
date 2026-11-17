"use client";

import { useState } from "react";
import { PenSquare, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormulaPillItem, PillRow } from "./FormulaHistoryPanel";

// =====================================================================
// Types
// =====================================================================

export interface ImpactRow {
  line: string;
  availableBefore: string;
  availableAfter: string;
  capacityBefore: string;
  capacityAfter: string;
  status: "Normal" | "Warning" | "NG";
}

export interface ReviewActivateModalProps {
  scopeName: string;
  scopeType: string;
  version: string;
  effectiveDate: string;
  oldName: string;
  newName: string;
  oldVersionLabel: string;
  newVersionLabel: string;
  oldPills: FormulaPillItem[];
  newPills: FormulaPillItem[];
  appliesLines: string[];
  impactRows: ImpactRow[];
  downstreamNotes: string[];
  reason: string;
  onReasonChange: (reason: string) => void;
  onClose: () => void;
  onBackToEditing: () => void;
  onConfirm: () => void;
}

const STATUS_STYLES: Record<ImpactRow["status"], string> = {
  Normal: "bg-emerald-500",
  Warning: "bg-amber-500",
  NG: "bg-red-500",
};

export function ReviewActivateModal({
  scopeName,
  scopeType,
  version,
  effectiveDate,
  oldName,
  newName,
  oldVersionLabel,
  newVersionLabel,
  oldPills,
  newPills,
  appliesLines,
  impactRows,
  downstreamNotes,
  reason,
  onReasonChange,
  onClose,
  onBackToEditing,
  onConfirm,
}: ReviewActivateModalProps) {
  const [reasonExpanded, setReasonExpanded] = useState(true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50">
              <PenSquare size={18} className="text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Review before it goes live
              </h2>
              <p className="text-sm text-muted-foreground">
                {oldName} · {scopeName} · {scopeType} · {version} · takes effect{" "}
                {effectiveDate}
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

        <div className="flex-1 overflow-y-auto p-5">
          {/* Formula change */}
          <h3 className="text-sm font-semibold text-foreground">
            Formula change
          </h3>
          <div className="mt-2 rounded-xl border border-border">
            <div className="grid grid-cols-[100px_1fr] gap-3 border-b border-border p-3 text-sm">
              <span className="text-muted-foreground">Name</span>
              <span className="text-foreground">
                {oldName} → <span className="font-semibold">{newName}</span>
              </span>
            </div>

            <div className="grid grid-cols-[100px_1fr] gap-3 border-b border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {scopeName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {oldVersionLabel}
                </p>
              </div>
              <PillRow
                pills={oldPills}
                diffAgainst={newPills}
                diffAs="removed"
              />
            </div>

            <div className="grid grid-cols-[100px_1fr] gap-3 p-3">
              <div>
                <p className="text-sm font-medium text-foreground">New</p>
                <p className="text-xs text-muted-foreground">
                  {newVersionLabel}
                </p>
              </div>
              <PillRow pills={newPills} diffAgainst={oldPills} diffAs="added" />
            </div>
          </div>

          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs border border-emerald-300 bg-emerald-50" />
              Added
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs border border-red-400 bg-white" />
              Removed
            </span>
          </div>

          {/* Where it applies (lines) */}
          <h3 className="mt-5 text-sm font-semibold text-foreground">
            Where it applies
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {appliesLines.length} line{appliesLines.length === 1 ? "" : "s"}:{" "}
            {appliesLines.join(", ")}.
          </p>

          {/* Impact table */}
          <h3 className="mt-5 text-sm font-semibold text-foreground">
            Impact in {effectiveDate.replace(/^\d+\s/, "")}
          </h3>
          <div className="mt-2 overflow-hidden rounded-xl border border-border">
            <div className="grid grid-cols-[1fr_1.4fr_1fr_auto] gap-3 bg-neutral-50 px-4 py-2.5 text-xs font-medium text-muted-foreground">
              <span>Line</span>
              <span>Available capacity</span>
              <span>Capacity %</span>
              <span>Status</span>
            </div>
            <div className="divide-y divide-border">
              {impactRows.map((row) => (
                <div
                  key={row.line}
                  className="grid grid-cols-[1fr_1.4fr_1fr_auto] items-center gap-3 px-4 py-3 text-sm"
                >
                  <span className="font-medium text-foreground">
                    {row.line}
                  </span>
                  <span className="text-foreground">
                    {row.availableBefore} to {row.availableAfter}
                  </span>
                  <span className="text-foreground">
                    {row.capacityBefore} to {row.capacityAfter}
                  </span>
                  <span
                    className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium text-white ${STATUS_STYLES[row.status]}`}
                  >
                    {row.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Downstream effects */}
          <h3 className="mt-5 text-sm font-semibold text-foreground">
            What else updates
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {downstreamNotes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>

          {/* Reason */}
          <div className="mt-5">
            <button
              onClick={() => setReasonExpanded((e) => !e)}
              className="flex w-full items-center justify-between text-sm font-semibold text-foreground"
            >
              <span>
                Reason for this change <span className="text-red-500">*</span>
              </span>
              {reasonExpanded ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>
            {reasonExpanded && (
              <textarea
                value={reason}
                onChange={(e) => onReasonChange(e.target.value)}
                placeholder="For example: weekly die change on ASCC 02 is now counted as planned downtime."
                rows={2}
                className="mt-2 w-full resize-none rounded-lg border border-border p-3 text-sm outline-none focus:border-violet-400"
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border p-4">
          <Button
            variant="outline"
            className="h-10 px-4"
            onClick={onBackToEditing}
          >
            Back to editing
          </Button>
          <Button
            className="h-10 px-4"
            disabled={!reason.trim()}
            onClick={onConfirm}
          >
            Scheduled for {effectiveDate}
          </Button>
        </div>
      </div>
    </div>
  );
}
