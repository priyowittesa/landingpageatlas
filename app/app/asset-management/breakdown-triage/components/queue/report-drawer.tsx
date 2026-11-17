"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  Ban,
  BookOpen,
  CalendarClock,
  Check,
  ChevronDown,
  ClipboardList,
  Clock,
  Database,
  Download,
  FileText,
  Flame,
  Gauge,
  GitBranch,
  GitMerge,
  History,
  Info,
  ListChecks,
  Loader2,
  Lock,
  MessageSquareWarning,
  MoreHorizontal,
  Package,
  PackageX,
  Pencil,
  Play,
  PlayCircle,
  Plus,
  Power,
  RefreshCw,
  Reply,
  RotateCcw,
  Save,
  SearchCheck,
  Shield,
  ShieldAlert,
  StickyNote,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Undo2,
  User,
  UserPlus,
  Wand2,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import ConfirmationModal from "@/components/ConfirmationModal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";
import { format2 } from "../../lib/scoring";
import type { ScoringWeights } from "../../lib/types";
import { useActiveScoringConfiguration, useScoringConfiguration } from "../../scoring/use-scoring-configurations";
import { LoadState } from "../cursor-pager";
import { PriorityBadge, StateBadge, StatusPill, StockBadge } from "../triage-badges";
import {
  activityIcon,
  formatAgo,
  formatClock,
  formatDay,
  formatHours,
  formatWhen,
  initials,
  isOpenReport,
  MACHINE_STATUS_LABELS,
  PRIORITY_HINTS,
  priorityReasons,
  triageWarnings,
} from "./queue-helpers";
import { RowActionsMenu, type QueueActions } from "./row-actions";
import {
  useAddNote,
  useBreakdownReport,
  useCaseFeedback,
  useDeleteNote,
  useDownloadDocument,
  useUpdateNote,
  type CaseFeedbackReason,
  type QueueReport,
  type SimilarCaseEntry,
} from "./use-breakdown-reports";

export type DrawerFocus = "notes" | "activity" | null;

function Section({
  id,
  icon: Icon,
  title,
  aside,
  children,
}: {
  id?: string;
  icon: LucideIcon;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
        <Icon className="h-4 w-4 text-primary-600" />
        {title}
        {aside && <span className="ml-auto text-xs font-normal text-gray-500">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

type AlertTone = "red" | "amber" | "blue" | "primary" | "muted";

const ALERT_CLASSES: Record<AlertTone, string> = {
  red: "border-red-200 bg-red-50 text-red-900 [&>svg]:text-red-600",
  amber: "border-amber-200 bg-amber-50 text-amber-900 [&>svg]:text-amber-600",
  blue: "border-blue-200 bg-blue-50 text-blue-900 [&>svg]:text-blue-600",
  primary: "border-primary-200 bg-primary-50 text-primary-900 [&>svg]:text-primary-600",
  muted: "border-gray-200 bg-gray-50 text-gray-700 [&>svg]:text-gray-500",
};

function Alert({ tone, icon: Icon, children, action }: { tone: AlertTone; icon: LucideIcon; children: ReactNode; action?: ReactNode }) {
  return (
    <div className={cn("flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-[13px] leading-5", ALERT_CLASSES[tone])}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1">{children}</div>
      {action}
    </div>
  );
}

function ScoreBar({ label, code, weight, value }: { label: string; code: string; weight: number | null; value: number }) {
  return (
    <div className="grid grid-cols-[1fr_120px_44px] items-center gap-3 text-[13px]">
      <div>
        {label} <small className="font-mono text-gray-500">{code}{weight != null && ` × ${format2(weight)}`}</small>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-primary-500" style={{ width: `${Math.min(value, 1) * 100}%` }} />
      </div>
      <div className="text-right font-mono font-medium">{format2(weight != null ? value * weight : value)}</div>
    </div>
  );
}

const SAFETY_FIRST_STEP = /lock[- ]?out|isolat|shut down|switch off|clear a/i;

function RecommendedActions({ report }: { report: QueueReport }) {
  const triage = report.triage!;
  const [first, ...rest] = triage.steps;
  const safe = first && (first.isSafety || SAFETY_FIRST_STEP.test(first.instruction));
  const sopOnly = triage.fallback === "no_history";
  return (
    <Section icon={ListChecks} title="Recommended actions">
      {first ? (
        <>
          <div className={cn("flex gap-3 rounded-lg border p-3", safe ? "border-red-200 bg-red-50" : "border-primary-200 bg-primary-50")}>
            {safe ? <Lock className="mt-0.5 h-4 w-4 shrink-0 text-red-600" /> : <PlayCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />}
            <div>
              <div className="text-xs text-gray-500">First step{safe && " · safety"}</div>
              <b className="text-sm">{first.instruction}</b>
            </div>
          </div>
          <ol className="mt-3 space-y-2">
            {rest.map((step, index) => (
              <li key={`${index}-${step.instruction}`} className="flex gap-3 text-[13.5px]">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">{index + 2}</span>
                <span>{step.instruction}{step.isSafety && <StatusPill tone="red" icon={ShieldAlert}>safety</StatusPill>}</span>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <div className="text-[13px] text-gray-500">No recommended steps for this report.</div>
      )}
      <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-3">
        <div>
          <div className="text-xs text-gray-500">Estimated repair time</div>
          <div className="mt-0.5 text-lg font-semibold">{formatHours(triage.estimatedHours)}</div>
          <div className="text-xs text-gray-500">{triage.estimatedHours ? "Median duration of similar cases" : "No duration data yet"}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Step source</div>
          <div className="mt-0.5 text-sm font-semibold">{sopOnly ? "SOP" : "Similar cases + SOP"}</div>
          <div className="text-xs text-gray-500">
            {sopOnly ? (triage.documents[0]?.code || "Asset-type SOP") : `${triage.similarCases.length} cases · ${triage.documents.length} documents`}
          </div>
        </div>
      </div>
      <p className="mt-3 flex items-start gap-2 text-xs text-gray-500">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Recommendations are based on history and available data. Verify conditions on site before acting.
      </p>
    </Section>
  );
}

function ProbableCause({ report }: { report: QueueReport }) {
  const triage = report.triage!;
  const low = triage.causeConfidence === "Low";
  return (
    <Section icon={SearchCheck} title="Probable cause">
      {!triage.cause ? (
        <>
          <div className="text-sm font-semibold">Can&apos;t be estimated yet</div>
          <div className="mt-1 text-[13px] text-gray-500">No similar cases above the threshold. Follow the diagnostic steps in the SOP.</div>
          <div className="mt-2"><StatusPill tone="muted" icon={History}>No history</StatusPill></div>
        </>
      ) : (
        <>
          <div className="text-[15px] font-semibold">{low && "Possibly: "}{triage.cause}</div>
          {triage.evidence && <div className="mt-1 text-[13px] text-gray-500">{triage.evidence}</div>}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {triage.causeConfidence && (
              <StatusPill
                tone={triage.causeConfidence === "High" ? "green" : triage.causeConfidence === "Medium" ? "amber" : "red"}
                icon={low ? AlertTriangle : Gauge}
              >
                {triage.causeConfidence} confidence
              </StatusPill>
            )}
            {triage.inferred && <StatusPill tone="muted" icon={Wand2}>inferred</StatusPill>}
            {triage.fallback === "asset_type" && <StatusPill tone="muted" icon={GitBranch}>Asset-type fallback</StatusPill>}
          </div>
          {low && (
            <div className="mt-3">
              <Alert tone="amber" icon={AlertTriangle}>
                <b>Low confidence.</b> Treat this as a hypothesis, not a fact. Check for other symptoms on site.
              </Alert>
            </div>
          )}
        </>
      )}
    </Section>
  );
}

const FEEDBACK_REASONS: [CaseFeedbackReason, string][] = [
  ["different_asset", "Different asset/type"],
  ["different_symptoms", "Different symptoms"],
  ["action_not_helpful", "Action did not help"],
];

function SimilarCaseCard({ report, item, onOpenCase }: { report: QueueReport; item: SimilarCaseEntry; onOpenCase: () => void }) {
  const feedback = useCaseFeedback();
  // Shown right away; the saved verdict comes back with the report.
  const [current, setCurrent] = useState(item.feedback);
  const send = (verdict: "relevant" | "not_relevant" | "", reason?: CaseFeedbackReason) => {
    const previous = current;
    setCurrent({ verdict: verdict || null, reason: reason ?? null });
    feedback.mutate({ caseId: item.id, verdict, reason }, { onError: () => setCurrent(previous) });
  };
  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <button type="button" className="text-sm font-semibold text-primary-700 hover:underline" onClick={onOpenCase}>
            {item.workOrder || "Historical case"}
          </button>
          {item.code && <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px]">{item.code}</code>}
        </span>
        <span className="flex items-center gap-2 text-xs text-gray-600">
          <span className="h-1.5 w-14 overflow-hidden rounded-full bg-gray-100">
            <span className="block h-full bg-primary-500" style={{ width: `${item.similarity * 100}%` }} />
          </span>
          {Math.round(item.similarity * 100)}% similar
        </span>
      </div>
      <div className="mt-1.5 text-[13.5px] font-medium">{item.action || "—"}</div>
      <div className="text-xs text-gray-500">
        {[item.assetCode && item.assetCode !== report.asset.code ? item.assetCode : "", item.date && formatDay(item.date), formatHours(item.hours), item.technician]
          .filter(Boolean)
          .join(" · ")}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={feedback.isPending}
          className={cn("h-7 text-xs", current.verdict === "relevant" && "border-green-300 bg-green-50 text-green-700")}
          onClick={() => send(current.verdict === "relevant" ? "" : "relevant")}
        >
          <ThumbsUp className="h-3.5 w-3.5" />Relevant
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={feedback.isPending}
          className={cn("h-7 text-xs", current.verdict === "not_relevant" && "border-red-300 bg-red-50 text-red-700")}
          onClick={() => send(current.verdict === "not_relevant" ? "" : "not_relevant")}
        >
          <ThumbsDown className="h-3.5 w-3.5" />Not relevant
        </Button>
        {current.verdict && !feedback.isPending && (
          <span className="ml-auto flex items-center gap-1 text-xs text-green-700"><Check className="h-3.5 w-3.5" />Feedback saved</span>
        )}
      </div>
      {current.verdict === "not_relevant" && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {FEEDBACK_REASONS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              disabled={feedback.isPending}
              onClick={() => send("not_relevant", current.reason === value ? undefined : value)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs",
                current.reason === value ? "border-primary-300 bg-primary-50 text-primary-700" : "border-gray-200 text-gray-600 hover:border-primary-200"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SimilarCases({ report, onOpenCase }: { report: QueueReport; onOpenCase: (caseId: string) => void }) {
  const triage = report.triage!;
  const cases = triage.similarCases.slice(0, 3);
  return (
    <Section icon={History} title="Similar cases" aside={cases.length ? `${cases.length} of max. 3 · similarity ≥ 0.30` : undefined}>
      {!cases.length ? (
        <Alert tone="blue" icon={Info}>
          <b>No history.</b> Not enough history available. Recommendations use the SOP or asset-type patterns.
        </Alert>
      ) : (
        <div className="space-y-3">
          {triage.fallback === "asset_type" && (
            <Alert tone="blue" icon={GitBranch}>
              <b>Asset-type fallback.</b> This asset has fewer than 5 WOs, so cases are drawn from the same asset type.
            </Alert>
          )}
          {cases.map((item) => (
            <SimilarCaseCard key={item.id} report={report} item={item} onOpenCase={() => onOpenCase(item.id)} />
          ))}
        </div>
      )}
    </Section>
  );
}

function Notes({ report, startEditing }: { report: QueueReport; startEditing: boolean }) {
  const { user } = useCurrentUser();
  const add = useAddNote();
  const update = useUpdateNote();
  const remove = useDeleteNote();
  const [editing, setEditing] = useState<string | "new" | null>(startEditing ? "new" : null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string>();
  const [deleting, setDeleting] = useState<string | null>(null);
  const saving = add.isPending || update.isPending;
  // Only the author may edit or delete a note (the API answers 403 otherwise).
  const mine = (note: QueueReport["notes"][number]) =>
    Boolean(user && ((note.byId && note.byId === user.id) || (!note.byId && note.by && note.by === user.name)));

  const startEdit = (target: string | "new", value = "") => {
    setEditing(target);
    setText(value);
    setError(undefined);
  };

  const save = () => {
    const body = text.trim();
    if (body.length < 2) {
      setError("The note can't be empty.");
      return;
    }
    const done = (message: string) => () => {
      toast.success(message);
      setEditing(null);
    };
    if (editing === "new") add.mutate({ id: report.id, body }, { onSuccess: done("Note added") });
    else if (editing) update.mutate({ noteId: editing, body }, { onSuccess: done("Note updated") });
  };

  const editor = (
    <div className="mt-3">
      <Textarea
        autoFocus
        className={cn("min-h-16", error && "border-red-500")}
        placeholder="Write a note for technicians and other supervisors"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
      <div className="mt-2 flex justify-end gap-2">
        <Button size="sm" variant="outline" disabled={saving} onClick={() => setEditing(null)}>Cancel</Button>
        <Button size="sm" disabled={saving} onClick={save}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}Save
        </Button>
      </div>
    </div>
  );

  return (
    <Section
      id="triage-notes"
      icon={StickyNote}
      title="Notes"
      aside={
        editing == null ? (
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => startEdit("new")}>
            <Plus className="h-3.5 w-3.5" />Note
          </Button>
        ) : undefined
      }
    >
      {report.notes.length === 0 && editing !== "new" && <div className="text-[13px] text-gray-500">No notes yet.</div>}
      <div className="divide-y divide-gray-100">
        {report.notes.map((note) =>
          editing === note.id ? (
            <div key={note.id}>{editor}</div>
          ) : (
            <div key={note.id} className="flex items-start justify-between gap-3 py-2.5">
              <div className="flex items-start gap-2.5">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-100 text-[11px] font-semibold text-primary-700">
                  {initials(note.by || "?")}
                </span>
                <div>
                  <div className="whitespace-pre-wrap text-[13.5px]">{note.text}</div>
                  <div className="text-xs text-gray-500">
                    {[note.by, formatWhen(note.at)].filter(Boolean).join(" · ")}
                    {note.edited && " · edited"}
                  </div>
                </div>
              </div>
              {mine(note) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Note actions"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => startEdit(note.id, note.text)}><Pencil className="h-4 w-4" />Edit note</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600 focus:text-red-700" onSelect={() => setDeleting(note.id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />Delete note
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )
        )}
      </div>
      {editing === "new" && editor}
      <ConfirmationModal
        open={deleting != null}
        onOpenChange={(open) => !open && setDeleting(null)}
        variant="delete"
        title="Delete note?"
        description="This note will be removed from the report."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => {
          if (deleting) remove.mutate(deleting, { onSuccess: () => toast.success("Note deleted") });
          setDeleting(null);
        }}
      />
    </Section>
  );
}

function Documents({ report }: { report: QueueReport }) {
  const download = useDownloadDocument();
  const documents = report.triage?.documents ?? [];
  const open = (id: string) => {
    // Open the tab synchronously so the browser does not block it as a popup.
    const tab = window.open("", "_blank");
    download.mutate(id, {
      onSuccess: (link) => {
        if (tab) tab.location.href = link;
        else window.open(link, "_blank", "noopener");
      },
      onError: () => tab?.close(),
    });
  };
  return (
    <Section icon={FileText} title="Documents / SOP">
      {documents.length ? (
        <div className="space-y-2">
          {documents.map((document) => (
            <div key={document.id} className="flex items-start gap-3 rounded-lg border border-gray-200 p-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-600">
                {document.type === "SOP" ? <ClipboardList className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <b className="text-[13.5px]">{document.title}</b>
                <div className="text-xs text-gray-500">{[document.type, document.code, document.pages].filter(Boolean).join(" · ")}</div>
                {document.snippet && <p className="mt-1 text-xs text-gray-600">{document.snippet}</p>}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                disabled={download.isPending && download.variables === document.id}
                onClick={() => open(document.id)}
              >
                {download.isPending && download.variables === document.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Open"}
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-[13px] text-gray-500">No documents available for this asset.</div>
      )}
    </Section>
  );
}

export function ReportDrawer({
  reportId,
  initial,
  actions,
  focus,
  onClose,
}: {
  reportId: string;
  /** The list row, shown until the full report has loaded. */
  initial?: QueueReport;
  actions: QueueActions;
  focus: DrawerFocus;
  onClose: () => void;
}) {
  const detail = useBreakdownReport(reportId, initial);
  const report = detail.data;
  const active = useActiveScoringConfiguration();
  // Weights of the version that scored this report; the active version until that one has loaded.
  const scoredWith = useScoringConfiguration(report?.triage?.configurationId || undefined);
  const config = scoredWith.data ?? active.data ?? null;
  const loaded = Boolean(report && !detail.isPlaceholderData);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!focus || !loaded) return;
    const timeout = window.setTimeout(() => {
      document.getElementById(focus === "notes" ? "triage-notes" : "triage-activity")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    return () => window.clearTimeout(timeout);
  }, [focus, loaded]);

  const weights: ScoringWeights | null = config?.config.weights ?? null;
  const version = report?.configVersion ?? config?.version ?? null;
  const triage = report?.triage ?? null;
  const open = report ? isOpenReport(report) : false;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} aria-hidden="true" />
      <aside
        role="dialog"
        aria-label="Triage details"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[560px] flex-col bg-gray-50 shadow-2xl animate-in slide-in-from-right duration-200"
      >
        <header className="flex items-start justify-between gap-3 border-b border-gray-200 bg-white px-5 py-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold">{report?.code ?? "Breakdown report"}</span>
              {report && <StateBadge state={report.state} />}
              {detail.isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />}
            </div>
            {report && (
              <div className="mt-0.5 text-[13px] text-gray-500">
                {report.workOrder ? `${report.workOrder} from ${report.source === "fabrix" ? "Fabrix" : "manual report"}` : "Manual report"} · assigned to {report.technician.name}
              </div>
            )}
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close"><X className="h-4 w-4" /></Button>
        </header>

        {!report ? (
          <div className="flex-1"><LoadState error={detail.isError} onRetry={() => detail.refetch()} /></div>
        ) : (
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {report.state === "cancelled" && report.cancellation && (
              <Alert tone="muted" icon={Ban}>
                <b>Cancelled{report.cancellation.reason && `: ${report.cancellation.reason.replaceAll("_", " ")}`}{report.cancellation.duplicateOf && ` of ${report.cancellation.duplicateOf}`}.</b>{" "}
                {report.cancellation.note && `“${report.cancellation.note}” `}
                {[report.cancellation.by, formatWhen(report.cancellation.at)].filter(Boolean).join(", ")}. The report is kept for audit and excluded from evaluation metrics.
              </Alert>
            )}

            <Section icon={Gauge} title="Priority & safety" aside={version != null ? `Config v${version}` : undefined}>
              <div className="flex flex-wrap items-center gap-4">
                <PriorityBadge report={report} large />
                <div>
                  <div className="text-xs text-gray-500">Score</div>
                  <div className="font-mono text-[22px] font-extrabold">
                    {report.score != null ? format2(report.score) : "—"}
                    <span className="text-[13px] font-medium text-gray-500"> / 1.00</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold">{PRIORITY_HINTS[report.priority]}</div>
                  {report.override && <div className="mt-1"><StatusPill tone="amber" icon={Pencil}>Supervisor override</StatusPill></div>}
                </div>
              </div>
              {report.safetyOverride && !report.override && (
                <div className="mt-3">
                  <Alert tone="red" icon={ShieldAlert}>
                    <b>Safety override active.</b> Score {report.score != null ? format2(report.score) : "—"} is below the P1 threshold
                    {config && ` (${format2(config.config.p1Threshold)})`} and was raised automatically due to a safety signal.
                  </Alert>
                </div>
              )}
              {report.override && (
                <div className="mt-3">
                  <Alert
                    tone="primary"
                    icon={Pencil}
                    action={
                      open ? (
                        <Button size="sm" variant="outline" className="h-7 shrink-0 text-xs" onClick={() => actions.openDialog("revert", report)}>
                          <RotateCcw className="h-3.5 w-3.5" />Revert
                        </Button>
                      ) : undefined
                    }
                  >
                    <b>{report.override.from} → {report.override.to}</b>
                    {[report.override.by, formatWhen(report.override.at)].filter(Boolean).length > 0 &&
                      ` by ${[report.override.by, formatWhen(report.override.at)].filter(Boolean).join(", ")}`}
                    . {report.override.reason && `“${report.override.reason}” `}
                    <span className="text-gray-500">Original value {report.systemPriority}{report.score != null && ` · ${format2(report.score)}`} is preserved.</span>
                  </Alert>
                </div>
              )}
              {priorityReasons(report).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {priorityReasons(report).map((reason) => (
                    <span key={reason} className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700">
                      <Check className="h-3 w-3 text-green-600" />{reason}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Download className="h-3.5 w-3.5" />Reported {formatWhen(report.reportedAt)}</span>
                {report.lastEvent && <span className="flex items-center gap-1"><RefreshCw className="h-3.5 w-3.5" />Updated {formatWhen(report.lastEvent.at)}</span>}
              </div>
              {report.components && (
                <details className="group mt-3 border-t border-dashed border-gray-200 pt-3">
                  <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[13px] font-medium text-primary-700">
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                    Score breakdown by component
                  </summary>
                  <div className="mt-3 space-y-2.5">
                    <ScoreBar label="Criticality" code="S_crit" weight={weights?.criticality ?? null} value={report.components.criticality} />
                    <ScoreBar label="Production impact" code="S_prod" weight={weights?.production ?? null} value={report.components.production} />
                    <ScoreBar label="Safety" code="S_safety" weight={weights?.safety ?? null} value={report.components.safety} />
                    <ScoreBar label="History" code="S_hist" weight={weights?.history ?? null} value={report.components.history} />
                  </div>
                </details>
              )}
            </Section>

            {report.safety && (
              <Alert tone="red" icon={Flame}>
                <b>Safety risk detected.</b> Follow the shutdown SOP before the technician approaches the asset.
              </Alert>
            )}
            {triageWarnings(report).map((warning) => (
              <Alert key={warning} tone="amber" icon={PackageX}>{warning}</Alert>
            ))}

            <Section icon={MessageSquareWarning} title="Asset & report">
              <div className="mb-3 flex items-start gap-2.5">
                {report.asset.criticality && <CriticalityMark criticality={report.asset.criticality} large />}
                <div>
                  <b className="text-[15px]">{report.asset.name || "—"}</b>
                  <div className="text-xs text-gray-500">{[report.asset.code, report.asset.type, report.asset.location].filter(Boolean).join(" · ")}</div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {report.asset.bottleneck && <StatusPill tone="muted" icon={GitMerge}>Bottleneck</StatusPill>}
                    {report.asset.statutory && <StatusPill tone="muted" icon={BadgeCheck}>Statutory</StatusPill>}
                  </div>
                </div>
              </div>
              <div className="rounded-lg border-l-4 border-primary-300 bg-gray-50 px-3 py-2 text-[13.5px] italic">“{report.description}”</div>
              {report.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {report.tags.map((tag) => (
                    <span key={tag} className="rounded-md bg-primary-50 px-2 py-0.5 text-xs text-primary-700">#{tag}</span>
                  ))}
                </div>
              )}
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-gray-600">
                <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" />{report.reporter || "—"}</span>
                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{formatClock(report.reportedAt)} · {formatAgo(report.reportedAt)}</span>
                <span className="flex items-center gap-1.5"><Power className="h-3.5 w-3.5" />{MACHINE_STATUS_LABELS[report.machineStatus]}</span>
                <span className="flex items-center gap-1.5">
                  {report.safetyFlag ? <ShieldAlert className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                  {report.safetyFlag ? "Flagged as hazardous" : "Not flagged as hazardous"}
                </span>
              </div>
            </Section>

            {!loaded ? (
              <div className="rounded-xl border border-gray-200 bg-white"><LoadState error={detail.isError} onRetry={() => detail.refetch()} /></div>
            ) : !triage ? (
              <Alert tone="blue" icon={Info}>
                <b>Triage is not available yet.</b> The probable cause, recommended steps, similar cases and parts appear once the triage job has run.
              </Alert>
            ) : triage.status === "failed" ? (
              <Alert tone="amber" icon={AlertTriangle}>
                <b>Triage failed.</b> {triage.errorMessage || "The triage job could not finish for this report."}
              </Alert>
            ) : (
              <>
                <RecommendedActions report={report} />
                <ProbableCause report={report} />
                <SimilarCases report={report} onOpenCase={(caseId) => actions.openDialog("case", report, caseId)} />
                <Section icon={Package} title="Spare part" aside={triage.similarCases.length ? "From similar cases" : "Compatible with asset type"}>
                  {!triage.stockDataAvailable ? (
                    <div className="text-[13px] text-gray-500">Stock data is not available right now.</div>
                  ) : triage.spares.length ? (
                    <div className="divide-y divide-gray-100">
                      {triage.spares.slice(0, 5).map((part) => (
                        <div key={part.id} className="flex items-start justify-between gap-3 py-2.5">
                          <div>
                            <b className="text-[13.5px]">{part.name}</b>
                            <div className="text-xs text-gray-500">{[part.id, part.location].filter(Boolean).join(" · ")}</div>
                          </div>
                          <div className="text-right">
                            <StockBadge part={part} />
                            <div className="mt-1 text-xs text-gray-500">{part.qty === 0 ? `Lead time ${part.leadDays} days` : `Stock ${part.qty} · min ${part.min}`}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[13px] text-gray-500">No spare parts suggested.</div>
                  )}
                </Section>
                <Documents report={report} />
              </>
            )}

            {loaded && <Notes report={report} startEditing={focus === "notes"} />}

            {loaded && (
              <Section id="triage-activity" icon={Activity} title="Activity & audit">
                {report.events.length ? (
                  <ol className="space-y-3">
                    {report.events.map((item) => {
                      const Icon = activityIcon(item.type);
                      return (
                        <li key={item.id} className="flex gap-3">
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-600">
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <div>
                            <div className="text-[13px]">{item.text}{item.by && ` · ${item.by}`}</div>
                            <div className="font-mono text-xs text-gray-500">{formatWhen(item.at)}</div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <div className="text-[13px] text-gray-500">No activity recorded yet.</div>
                )}
                {triage && (
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-dashed border-gray-200 pt-3 text-xs text-gray-500">
                    {triage.profileComputedAt && (
                      <span className="flex items-center gap-1">
                        <Database className="h-3.5 w-3.5" />Asset profile {formatWhen(triage.profileComputedAt)}{triage.profileStale && " (stale)"}
                      </span>
                    )}
                    {triage.latencyMs != null && <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5" />Latency {(triage.latencyMs / 1000).toFixed(2)} s</span>}
                  </div>
                )}
              </Section>
            )}
          </div>
        )}

        {report && (
          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 bg-white px-5 py-3">
            {report.state === "cancelled" ? (
              <>
                <span className="text-xs text-gray-500">Cancelled reports can&apos;t be edited. Restore it first if it was cancelled by mistake.</span>
                <Button variant="outline" disabled={actions.busy} onClick={() => actions.restore(report)}><Undo2 className="h-4 w-4" />Restore report</Button>
              </>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {open && (
                    <>
                      <Button variant="outline" onClick={() => actions.openDialog("override", report)}><Pencil className="h-4 w-4" />Change priority</Button>
                      {report.state === "escalated" ? (
                        <Button variant="outline" onClick={() => actions.openDialog("escalation", report)}><Reply className="h-4 w-4" />Respond to escalation</Button>
                      ) : report.state === "scheduled" ? (
                        <Button variant="outline" onClick={() => actions.openDialog("reschedule", report)}><CalendarClock className="h-4 w-4" />Reschedule</Button>
                      ) : (
                        <Button variant="outline" disabled={actions.busy} onClick={() => actions.escalate(report)}><ArrowUpRight className="h-4 w-4" />Escalate</Button>
                      )}
                    </>
                  )}
                  <RowActionsMenu report={report} actions={actions} inDrawer />
                </div>
                {open && (
                  <div className="flex gap-2">
                    {report.state === "new" && (
                      <Button variant="outline" disabled={actions.busy} onClick={() => actions.start(report)}><Play className="h-4 w-4" />Start</Button>
                    )}
                    <Button onClick={() => actions.openDialog("assign", report)}><UserPlus className="h-4 w-4" />Assign</Button>
                  </div>
                )}
              </>
            )}
          </footer>
        )}
      </aside>
    </>
  );
}

export function CriticalityMark({ criticality, large }: { criticality: "A" | "B" | "C"; large?: boolean }) {
  const tone = { A: "bg-red-100 text-red-700", B: "bg-amber-100 text-amber-800", C: "bg-indigo-100 text-indigo-800" }[criticality];
  return (
    <span
      title={`Criticality ${criticality}`}
      className={cn("grid shrink-0 place-items-center rounded-md font-bold", large ? "h-[26px] w-[26px] text-[13px]" : "h-[22px] w-[22px] text-xs", tone)}
    >
      {criticality}
    </span>
  );
}
