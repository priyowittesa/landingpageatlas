"use client";

import { AlertTriangle, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PriorityTag, StatusPill } from "../components/triage-badges";
import { computePriority, format2, round2 } from "../lib/scoring";
import { useTriageStore } from "../lib/use-triage-store";
import type { ScoringConfig } from "../lib/types";

/** Recalculates every visible report with `candidate` and compares it to the `active` config. */
export function ImpactPreview({
  candidate,
  candidateVersion,
  active,
  activeVersion,
  description,
}: {
  candidate: ScoringConfig;
  candidateVersion: number;
  active: ScoringConfig;
  activeVersion: number;
  description: string;
}) {
  const reports = useTriageStore((state) => state.reports);
  const assets = useTriageStore((state) => state.assets);

  const rows = reports
    .filter((report) => !report.hidden && report.state !== "cancelled")
    .map((report) => {
      const before = computePriority(report, active, assets);
      const after = computePriority(report, candidate, assets);
      return { report, before, after, changed: before.priority !== after.priority, delta: round2(after.score - before.score) };
    });
  const changed = rows.filter((row) => row.changed).length;

  return (
    <section className="rounded-xl border bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 p-5">
        <div>
          <h3 className="font-semibold text-gray-950">Impact preview</h3>
          <p className="mt-0.5 text-sm text-gray-500">{description}</p>
        </div>
        {changed ? (
          <StatusPill tone="amber" icon={AlertTriangle}>{changed} reports change category</StatusPill>
        ) : (
          <StatusPill tone="green" icon={Check}>No category changes</StatusPill>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500">
            <tr>
              <th className="px-4 py-3">Report</th>
              <th className="px-4 py-3">Score v{activeVersion} → v{candidateVersion}</th>
              <th className="px-4 py-3">Priority</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map(({ report, before, after, changed: rowChanged, delta }) => (
              <tr key={report.id} className={cn(rowChanged && "bg-amber-50/60")}>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{assets[report.assetId].name}</div>
                  <div className="text-xs text-gray-500">{report.id}</div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono">
                  <span className="inline-flex items-center gap-1.5">
                    {format2(before.score)}
                    <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                    <b>{format2(after.score)}</b>
                  </span>
                  {delta !== 0 && (
                    <span className={cn("ml-2 text-xs font-semibold", delta > 0 ? "text-red-600" : "text-green-700")}>
                      {delta > 0 ? "+" : ""}
                      {format2(delta)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2">
                    <PriorityTag priority={before.priority} safety={before.safety} />
                    <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                    <PriorityTag priority={after.priority} safety={after.safety} />
                  </span>
                  {after.safety && <div className="mt-1 text-xs text-gray-500">safety override</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
