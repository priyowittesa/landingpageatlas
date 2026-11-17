"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlarmClock,
  Check,
  CheckCircle2,
  CircleSlash,
  Cpu,
  Database,
  FileCode,
  History,
  Lightbulb,
  Package,
  RotateCcw,
  ScanSearch,
  Siren,
  Sparkles,
  User,
  Wrench,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ConfidenceBar, SeverityBadge } from "../components/triage-badges";
import type { AiInsight } from "../lib/types";
import { InsightStatusBadge, InsightTypeBadge, SnoozeMenu, useReopen } from "./insight-shared";
import { useAiInsight } from "./use-ai-insights";

const QUEUE_HREF = "/app/asset-management/breakdown-triage";

function Section({ icon: Icon, title, aside, children }: { icon: typeof Sparkles; title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="border-b border-gray-100 px-6 py-5 last:border-0">
      <h3 className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-gray-500">
        <Icon className="h-4 w-4 text-primary-600" />
        {title}
        {aside && <span className="ml-auto text-xs font-normal normal-case tracking-normal">{aside}</span>}
      </h3>
      {children}
    </section>
  );
}

export function InsightDetail({
  insightId,
  initial,
  onClose,
  onAccept,
  onDismiss,
}: {
  insightId: string | null;
  /** List item shown while the full insight loads. */
  initial?: AiInsight;
  onClose: () => void;
  onAccept: (insight: AiInsight) => void;
  onDismiss: (insight: AiInsight) => void;
}) {
  const query = useAiInsight(insightId ?? undefined, initial?.id === insightId ? initial : undefined);
  const insight = query.data;
  const { reopen, isPending: reopening } = useReopen();

  return (
    <Dialog open={Boolean(insightId)} onOpenChange={(open) => !open && onClose()}>
      {insightId && (
        <DialogContent
          aria-describedby={undefined}
          className="top-0 right-0 left-auto flex h-full max-h-screen w-full max-w-xl translate-x-0 translate-y-0 flex-col gap-0 rounded-none p-0 sm:max-w-xl data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100"
        >
          {!insight ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-sm text-gray-500">
              <DialogTitle className="sr-only">AI insight</DialogTitle>
              {query.isError ? (
                <>
                  Insight could not be loaded.
                  <Button variant="outline" size="sm" onClick={() => query.refetch()}>Try Again</Button>
                </>
              ) : (
                "Loading insight..."
              )}
            </div>
          ) : (
          <>
          <div className="border-b border-gray-200 px-6 py-5 pr-12">
            <div className="flex flex-wrap items-center gap-2">
              <InsightTypeBadge type={insight.type} />
              <SeverityBadge severity={insight.severity} />
              <InsightStatusBadge insight={insight} />
            </div>
            <DialogTitle className="mt-2 text-base leading-snug">{insight.title}</DialogTitle>
            <DialogDescription className="mt-1 text-xs">
              {insight.code || insight.id} · Atlas AI · {insight.createdAt}
            </DialogDescription>
          </div>

          <div className="flex-1 overflow-y-auto">
            {insight.status !== "open" && insight.outcome && (
              <div
                className={cn(
                  "mx-6 mt-5 flex gap-2.5 rounded-lg border p-3 text-sm",
                  insight.status === "accepted" ? "border-primary-200 bg-primary-50 text-primary-800" : "border-gray-200 bg-gray-50 text-gray-700"
                )}
              >
                {insight.status === "accepted" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : insight.status === "snoozed" ? <AlarmClock className="h-4 w-4 shrink-0" /> : <CircleSlash className="h-4 w-4 shrink-0" />}
                <div>{insight.outcome}</div>
              </div>
            )}

            <Section icon={Sparkles} title="Summary">
              <p className="text-sm leading-6 text-gray-800">{insight.description}</p>
              {insight.reportId && (
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <Link href={`${QUEUE_HREF}?report=${encodeURIComponent(insight.reportId)}`}>
                    <Siren className="h-4 w-4" />
                    Open report {insight.reportId}
                  </Link>
                </Button>
              )}
            </Section>

            <Section icon={ScanSearch} title="Why Atlas flagged this" aside={<ConfidenceBar value={insight.confidence} />}>
              <ul className="list-disc space-y-1.5 pl-5 text-sm leading-6 text-gray-800">
                {insight.why.map((reason) => <li key={reason}>{reason}</li>)}
              </ul>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1"><Cpu className="h-3.5 w-3.5" />{insight.modelName || "LLM Atlas"}</span>
                {insight.modelVersion && <span className="inline-flex items-center gap-1"><FileCode className="h-3.5 w-3.5" />{insight.modelVersion}</span>}
                <span className="inline-flex items-center gap-1"><Database className="h-3.5 w-3.5" />{insight.basis}</span>
              </div>
            </Section>

            <EvidenceSection insight={insight} />

            <Section icon={Lightbulb} title="Suggested action">
              <p className="text-sm leading-6 text-gray-800">{insight.suggestion}</p>
              {insight.assetCode && (
                <p className="mt-2 text-xs text-gray-500">
                  Asset: {[insight.assetCode, insight.assetName].filter(Boolean).join(" · ")}
                </p>
              )}
            </Section>

            <Section icon={History} title="Activity">
              <ol className="space-y-3">
                {[...insight.log].reverse().map((entry, index) => (
                  <li key={`${entry.at}-${index}`} className="flex gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-600"><User className="h-3.5 w-3.5" /></span>
                    <div>
                      <div className="text-sm text-gray-900">{entry.event}</div>
                      <div className="text-xs text-gray-500">{entry.by} · {entry.at}</div>
                    </div>
                  </li>
                ))}
                <li className="flex gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-600"><Sparkles className="h-3.5 w-3.5" /></span>
                  <div>
                    <div className="text-sm text-gray-900">Insight created by Atlas AI</div>
                    <div className="text-xs text-gray-500">{insight.createdAt}</div>
                  </div>
                </li>
              </ol>
            </Section>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-gray-200 px-6 py-4">
            {insight.status === "open" ? (
              <>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => onDismiss(insight)}>
                    <X className="h-4 w-4" />
                    Dismiss
                  </Button>
                  <SnoozeMenu insight={insight}>
                    <Button variant="outline">
                      <AlarmClock className="h-4 w-4" />
                      Snooze
                    </Button>
                  </SnoozeMenu>
                </div>
                <Button onClick={() => onAccept(insight)}>
                  <Check className="h-4 w-4" />
                  Accept{insight.kind !== "config" ? ` & ${insight.actionLabel.toLowerCase().replace("fabrix", "Fabrix")}` : ""}
                </Button>
              </>
            ) : (
              <>
                <span className="text-sm text-gray-500">
                  {insight.status === "accepted" ? "Accepted" : "Closed"} insights stay for audit.
                </span>
                <Button variant="outline" disabled={reopening} onClick={() => reopen(insight)}>
                  <RotateCcw className="h-4 w-4" />
                  Reopen
                </Button>
              </>
            )}
          </div>
          </>
          )}
        </DialogContent>
      )}
    </Dialog>
  );
}

const EVIDENCE_ICONS: Record<string, typeof Wrench> = { work_order: Wrench, report: Siren, stock: Package };

/** Snapshot values worth showing inline: scalars only, keys humanized. */
function snapshotFields(snapshot: Record<string, unknown>) {
  return Object.entries(snapshot)
    .filter(([, value]) => value != null && value !== "" && typeof value !== "object")
    .map(([key, value]) => `${key.replaceAll("_", " ")}: ${String(value)}`);
}

function EvidenceSection({ insight }: { insight: AiInsight }) {
  const evidence = insight.evidence ?? [];
  if (!evidence.length) return null;
  return (
    <Section icon={Wrench} title="Evidence" aside={<span className="text-gray-500">Read-only</span>}>
      <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
        {evidence.map((item, index) => {
          const Icon = EVIDENCE_ICONS[item.sourceType] ?? Database;
          const fields = snapshotFields(item.snapshot);
          return (
            <div key={`${item.sourceCode}-${index}`} className="px-3.5 py-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Icon className="h-3.5 w-3.5 text-gray-500" />
                <span className="font-semibold text-primary-700">{item.sourceCode || "—"}</span>
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] capitalize text-gray-700">{item.sourceType.replaceAll("_", " ")}</span>
                {item.observedAt && <span className="ml-auto text-gray-500">{item.observedAt}</span>}
              </div>
              {fields.length > 0 && <div className="mt-1 text-xs text-gray-500">{fields.join(" · ")}</div>}
            </div>
          );
        })}
      </div>
    </Section>
  );
}
