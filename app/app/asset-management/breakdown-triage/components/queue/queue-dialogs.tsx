"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  Archive,
  ArrowDownUp,
  ArrowUpRight,
  Ban,
  CalendarX,
  Info,
  Loader2,
  Save,
  ScanSearch,
  Search,
  Send,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import ConfirmationModal from "@/components/ConfirmationModal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/lib/utils";
import { format2, PRIORITIES } from "../../lib/scoring";
import type { Priority } from "../../lib/types";
import { PriorityTag } from "../triage-badges";
import { useTechnicians, type Technician } from "../use-technicians";
import { formatDay, formatHours, formatWhen } from "./queue-helpers";
import {
  useAssignReport,
  useBreakdownReport,
  useBreakdownReports,
  useCancelReport,
  useCancelSchedule,
  useOverridePriority,
  useRespondEscalation,
  useRevertOverride,
  useScheduleReport,
  type CancelReason,
  type EscalationAction,
  type QueueReport,
} from "./use-breakdown-reports";

export type QueueDialogKind = "override" | "revert" | "assign" | "escalation" | "reschedule" | "cancel" | "case";
export type QueueDialogState = { kind: QueueDialogKind; report: QueueReport; caseId?: string } | null;

function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
      <AlertCircle className="h-3.5 w-3.5" />
      {children}
    </p>
  );
}

function Option({
  selected,
  disabled,
  onSelect,
  children,
}: {
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex min-h-11 w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
        selected ? "border-primary-300 bg-primary-50" : "border-gray-200 bg-white hover:border-primary-200",
        disabled && "cursor-not-allowed opacity-60 hover:border-gray-200"
      )}
    >
      <span
        className={cn(
          "grid h-4 w-4 shrink-0 place-items-center rounded-full border",
          selected ? "border-primary-600" : "border-gray-300"
        )}
      >
        {selected && <span className="h-2 w-2 rounded-full bg-primary-600" />}
      </span>
      <span className="flex-1">{children}</span>
    </button>
  );
}

function Hint({ icon: Icon = Info, tone = "muted", children }: { icon?: typeof Info; tone?: "muted" | "primary" | "amber"; children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex gap-2.5 rounded-lg border px-3 py-2.5 text-[13px] leading-5",
        tone === "primary" && "border-primary-200 bg-primary-50 text-primary-900",
        tone === "amber" && "border-amber-200 bg-amber-50 text-amber-900",
        tone === "muted" && "border-gray-200 bg-gray-50 text-gray-700"
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

function Shell({
  title,
  description,
  onClose,
  footer,
  children,
  narrow,
}: {
  title: string;
  description: string;
  onClose: () => void;
  footer: ReactNode;
  children: ReactNode;
  narrow?: boolean;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn("max-h-[90vh] overflow-y-auto", narrow ? "sm:max-w-[440px]" : "sm:max-w-[540px]")}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">{children}</div>
        <DialogFooter>{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const subtitle = (report: QueueReport) => [report.code, report.asset.name].filter(Boolean).join(" · ");
const Spinner = ({ show, children }: { show: boolean; children: ReactNode }) => (show ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{children}</>);

function OverrideDialog({ report, onClose }: { report: QueueReport; onClose: () => void }) {
  const override = useOverridePriority();
  const [selected, setSelected] = useState<Priority | null>(null);
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<{ priority?: string; reason?: string }>({});

  const save = () => {
    const next = {
      priority: selected ? undefined : "Choose a new priority.",
      reason: reason.trim().length < 4 ? "A reason is required so the change can be audited." : undefined,
    };
    setErrors(next);
    if (next.priority || next.reason || !selected) return;
    override.mutate(
      { id: report.id, priority: selected, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success(`Priority changed ${report.priority} → ${selected}`);
          onClose();
        },
      }
    );
  };

  return (
    <Shell
      title="Change priority"
      description={subtitle(report)}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" disabled={override.isPending} onClick={onClose}>Cancel</Button>
          <Button disabled={override.isPending} onClick={save}><Spinner show={override.isPending}><Save className="h-4 w-4" /></Spinner>Save changes</Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-3">
        <div>
          <div className="text-xs text-gray-500">Current priority</div>
          <div className="mt-1 flex items-center gap-2">
            <PriorityTag priority={report.priority} />
            {report.score != null && <span className="font-mono text-sm">{format2(report.score)}</span>}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Original system value (read-only)</div>
          <div className="mt-1 flex items-center gap-2"><PriorityTag priority={report.systemPriority} /><span className="text-xs text-gray-500">preserved</span></div>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">New priority <span className="text-red-600">*</span></label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {PRIORITIES.map((priority) => {
            const isCurrent = priority === report.priority;
            return (
              <button
                key={priority}
                type="button"
                disabled={isCurrent}
                onClick={() => { setSelected(priority); setErrors((value) => ({ ...value, priority: undefined })); }}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs text-gray-600 transition-colors",
                  selected === priority ? "border-primary-400 bg-primary-50 ring-2 ring-primary-200" : "border-gray-200 hover:border-primary-200",
                  isCurrent && "cursor-not-allowed opacity-50 hover:border-gray-200"
                )}
              >
                <PriorityTag priority={priority} />
                {isCurrent ? "Current" : priority === "P1" ? "Handle immediately" : priority === "P2" ? "Respond ≤ 60 min" : "Schedule"}
              </button>
            );
          })}
        </div>
        <FieldError>{errors.priority}</FieldError>
      </div>
      <div>
        <label htmlFor="override-reason" className="text-sm font-medium">Reason <span className="text-red-600">*</span></label>
        <Textarea
          id="override-reason"
          className={cn("mt-2", errors.reason && "border-red-500")}
          placeholder="Example: only an indicator lamp, machine can be operated manually"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
        <FieldError>{errors.reason}</FieldError>
      </div>
      <Hint icon={ArrowDownUp} tone="primary">
        The report moves to its new place in the queue and the technician&apos;s triage card is updated. Your reason is used as calibration data for scoring weights.
      </Hint>
    </Shell>
  );
}

function RevertDialog({ report, onClose }: { report: QueueReport; onClose: () => void }) {
  const revert = useRevertOverride();
  return (
    <ConfirmationModal
      open
      onOpenChange={(open) => !open && onClose()}
      variant="submit"
      title="Restore system priority?"
      description={`Priority goes back from ${report.priority} to ${report.systemPriority}${report.score != null ? ` (score ${format2(report.score)})` : ""}. The previous override stays in the audit log and calibration data.`}
      confirmLabel="Restore"
      cancelLabel="Cancel"
      onConfirm={() =>
        revert.mutate(report.id, {
          onSuccess: () => {
            toast.success(`Priority restored to ${report.systemPriority}`);
            onClose();
          },
        })
      }
    />
  );
}

/** Searchable technician list (the roster can hold hundreds of people). */
function TechnicianPicker({
  technicians,
  loading,
  selected,
  current,
  onSelect,
}: {
  technicians: Technician[];
  loading: boolean;
  selected: string;
  current?: string;
  onSelect: (technician: Technician) => void;
}) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const value = query.trim().toLowerCase();
    return technicians.filter((technician) => !value || technician.name.toLowerCase().includes(value)).slice(0, 50);
  }, [technicians, query]);
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search technician" aria-label="Search technician" className="pl-9" />
      </div>
      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {loading ? (
          <p className="py-6 text-center text-sm text-gray-500">Loading technicians...</p>
        ) : visible.length ? (
          visible.map((technician) => (
            <Option key={technician.id} selected={selected === technician.id} onSelect={() => onSelect(technician)}>
              <span className="font-medium">{technician.name}</span>
              {current === technician.id && <span className="font-normal text-gray-500"> (current)</span>}
            </Option>
          ))
        ) : (
          <p className="py-6 text-center text-sm text-gray-500">No technicians match “{query}”.</p>
        )}
      </div>
    </div>
  );
}

function AssignDialog({ report, onClose }: { report: QueueReport; onClose: () => void }) {
  const { technicians, isLoading } = useTechnicians();
  const assign = useAssignReport();
  const [technician, setTechnician] = useState<Technician | null>(null);

  return (
    <Shell
      narrow
      title="Reassign"
      description={`${subtitle(report)} · now ${report.technician.name}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" disabled={assign.isPending} onClick={onClose}>Cancel</Button>
          <Button
            disabled={!technician || technician.id === report.technician.id || assign.isPending}
            onClick={() =>
              technician &&
              assign.mutate(
                { id: report.id, technicianId: technician.id, technicianName: technician.name },
                {
                  onSuccess: () => {
                    toast.success(`Assigned to ${technician.name}, triage card sent`);
                    onClose();
                  },
                }
              )
            }
          >
            <Spinner show={assign.isPending}><UserPlus className="h-4 w-4" /></Spinner>Assign
          </Button>
        </>
      }
    >
      <TechnicianPicker
        technicians={technicians}
        loading={isLoading}
        selected={technician?.id ?? ""}
        current={report.technician.id}
        onSelect={setTechnician}
      />
      <Hint>The triage card is sent to the new technician, and the previous technician is notified.</Hint>
    </Shell>
  );
}

const ESCALATION_REASONS: Record<string, string> = {
  need_senior_technician: "Needs a senior technician",
  part_unavailable: "Part unavailable",
  line_shutdown_required: "Line shutdown required",
  outside_expertise: "Outside expertise needed",
};

function EscalationDialog({ report, onClose }: { report: QueueReport; onClose: () => void }) {
  const detail = useBreakdownReport(report.id, report);
  const { technicians, isLoading } = useTechnicians();
  const respond = useRespondEscalation();
  const [action, setAction] = useState<EscalationAction | null>(null);
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();
  const last = detail.data?.escalations[0];

  const send = () => {
    const text = note.trim();
    if (!action) return;
    if (action === "continue" && text.length < 4) return setError("Write guidance for the technician.");
    if (action === "reassign" && !technician) return setError("Choose a technician.");
    respond.mutate(
      { id: report.id, action, note: text, technicianId: technician?.id, technicianName: technician?.name },
      {
        onSuccess: () => {
          toast.success("Escalation response sent");
          onClose();
        },
      }
    );
  };

  return (
    <Shell
      title="Respond to escalation"
      description={`${subtitle(report)} · ${report.technician.name}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" disabled={respond.isPending} onClick={onClose}>Cancel</Button>
          <Button disabled={!action || respond.isPending} onClick={send}><Spinner show={respond.isPending}><Send className="h-4 w-4" /></Spinner>Send response</Button>
        </>
      }
    >
      {last && (
        <Hint icon={ArrowUpRight} tone="amber">
          Escalated{last.by && ` by ${last.by}`}{last.at && `, ${formatWhen(last.at)}`}
          {last.reason && ` · ${ESCALATION_REASONS[last.reason] ?? last.reason.replaceAll("_", " ")}`}
          {last.note && `: “${last.note}”`}
        </Hint>
      )}
      <div className="space-y-2">
        {([
          ["reassign", "Send another / senior technician"],
          ["continue", `Continue with ${report.technician.name} and give guidance`],
          ["resolved", "Mark escalation resolved"],
        ] as const).map(([value, label]) => (
          <Option key={value} selected={action === value} onSelect={() => { setAction(value); setError(undefined); }}>{label}</Option>
        ))}
      </div>
      {action === "reassign" && (
        <TechnicianPicker
          technicians={technicians.filter((item) => item.id !== report.technician.id)}
          loading={isLoading}
          selected={technician?.id ?? ""}
          onSelect={(value) => { setTechnician(value); setError(undefined); }}
        />
      )}
      <div>
        <label htmlFor="escalation-note" className="text-sm font-medium">
          Guidance for the technician {action === "continue" ? <span className="text-red-600">*</span> : <span className="font-normal text-gray-500">(optional)</span>}
        </label>
        <Textarea
          id="escalation-note"
          className={cn("mt-2", error && action === "continue" && "border-red-500")}
          placeholder="Example: use the bearing from Line 1 stock, I have coordinated it"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        <FieldError>{error}</FieldError>
      </div>
    </Shell>
  );
}

const pad = (value: number) => String(value).padStart(2, "0");
/** `datetime-local` value in the browser's time zone. */
const toLocalInput = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
function slot(daysAhead: number, hour: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function RescheduleDialog({ report, onClose }: { report: QueueReport; onClose: () => void }) {
  const schedule = useScheduleReport();
  const unschedule = useCancelSchedule();
  const scheduled = report.state === "scheduled";
  // Read once when the dialog opens; the API rejects a time that has passed by the time it is saved.
  const [now] = useState(() => Date.now());
  const slots = useMemo(
    () =>
      [
        { label: "Today 20:00 · shift break", date: slot(0, 20) },
        { label: "Tomorrow 08:00", date: slot(1, 8) },
        { label: "Tomorrow 13:00", date: slot(1, 13) },
        { label: "In 2 days 08:00", date: slot(2, 8) },
      ].filter((option) => option.date.getTime() > now),
    [now]
  );
  const [value, setValue] = useState(() => (report.scheduledFor ? toLocalInput(new Date(report.scheduledFor)) : toLocalInput(slots[0]?.date ?? slot(1, 8))));
  const date = value ? new Date(value) : null;
  const future = Boolean(date && !Number.isNaN(date.getTime()) && date.getTime() > now);
  const busy = schedule.isPending || unschedule.isPending;

  return (
    <Shell
      narrow
      title={scheduled ? "Reschedule" : "Schedule"}
      description={`${subtitle(report)}${report.triage?.estimatedHours != null ? ` · estimate ${formatHours(report.triage.estimatedHours)}` : ""}`}
      onClose={onClose}
      footer={
        <div className="flex w-full flex-wrap justify-between gap-2">
          {scheduled ? (
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700"
              disabled={busy}
              onClick={() =>
                unschedule.mutate(report.id, {
                  onSuccess: () => {
                    toast.success("Schedule cancelled");
                    onClose();
                  },
                })
              }
            >
              <CalendarX className="h-4 w-4" />Cancel schedule
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" disabled={busy} onClick={onClose}>Close</Button>
            <Button
              disabled={!future || busy}
              onClick={() =>
                date &&
                schedule.mutate(
                  { id: report.id, scheduledFor: date },
                  {
                    onSuccess: () => {
                      toast.success(`Scheduled for ${formatWhen(date.toISOString())}`);
                      onClose();
                    },
                  }
                )
              }
            >
              <Spinner show={schedule.isPending}><Save className="h-4 w-4" /></Spinner>Save
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-2">
        {slots.map((option) => {
          const optionValue = toLocalInput(option.date);
          return (
            <Option key={option.label} selected={value === optionValue} onSelect={() => setValue(optionValue)}>
              {option.label}
            </Option>
          );
        })}
      </div>
      <div>
        <label htmlFor="schedule-at" className="text-sm font-medium">Or pick a time</label>
        <Input id="schedule-at" type="datetime-local" className="mt-2" value={value} onChange={(event) => setValue(event.target.value)} />
        {value && !future && <FieldError>The schedule must be in the future.</FieldError>}
      </div>
      <Hint>{report.technician.name} will be notified of the {scheduled ? "new " : ""}schedule.</Hint>
    </Shell>
  );
}

const CANCEL_REASONS: [CancelReason, string][] = [
  ["duplicate", "Duplicate of another report"],
  ["false_alarm", "Mistaken report / false alarm"],
  ["wrong_asset", "Wrong asset"],
  ["other", "Other"],
];

function CancelDialog({ report, onClose }: { report: QueueReport; onClose: () => void }) {
  const cancel = useCancelReport();
  const [reason, setReason] = useState<CancelReason | null>(null);
  const [duplicateOf, setDuplicateOf] = useState("");
  const [query, setQuery] = useState(report.asset.code);
  const search = useDebouncedValue(query.trim(), 350);
  const candidates = useBreakdownReports({ search: search || undefined, page_size: 20 });
  const others = (candidates.data?.items ?? []).filter((item) => item.id !== report.id);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{ reason?: string; duplicate?: string; note?: string }>({});

  const save = () => {
    const next = {
      reason: reason ? undefined : "Choose a cancellation reason.",
      duplicate: reason === "duplicate" && !duplicateOf ? "Choose the original report." : undefined,
      note: reason === "other" && note.trim().length < 4 ? "Explain the reason." : undefined,
    };
    setErrors(next);
    if (next.reason || next.duplicate || next.note || !reason) return;
    cancel.mutate(
      { id: report.id, reason, duplicateOf: reason === "duplicate" ? duplicateOf : undefined, note: note.trim() },
      {
        onSuccess: () => {
          toast.success(`${report.code} cancelled`);
          onClose();
        },
      }
    );
  };

  return (
    <Shell
      title="Cancel report"
      description={subtitle(report)}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" disabled={cancel.isPending} onClick={onClose}>Back</Button>
          <Button className="bg-red-600 text-white hover:bg-red-600/90" disabled={cancel.isPending} onClick={save}>
            <Spinner show={cancel.isPending}><Ban className="h-4 w-4" /></Spinner>Cancel report
          </Button>
        </>
      }
    >
      <div>
        <label className="text-sm font-medium">Reason <span className="text-red-600">*</span></label>
        <div className="mt-2 space-y-2">
          {CANCEL_REASONS.map(([value, label]) => (
            <Option key={value} selected={reason === value} onSelect={() => { setReason(value); setErrors({}); }}>{label}</Option>
          ))}
        </div>
        <FieldError>{errors.reason}</FieldError>
      </div>
      {reason === "duplicate" && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Duplicate of <span className="text-red-600">*</span></label>
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search code, asset, or description" aria-label="Search the original report" />
          <Select value={duplicateOf} onValueChange={setDuplicateOf}>
            <SelectTrigger className={cn("w-full", errors.duplicate && "border-red-500")}>
              <SelectValue placeholder={candidates.isFetching ? "Searching..." : others.length ? "Choose a report" : "No matching reports"} />
            </SelectTrigger>
            <SelectContent>
              {others.map((item) => (
                <SelectItem key={item.id} value={item.id}>{item.code} · {item.asset.name || item.description}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError>{errors.duplicate}</FieldError>
        </div>
      )}
      <div>
        <label htmlFor="cancel-note" className="text-sm font-medium">
          Note {reason === "other" ? <span className="text-red-600">*</span> : <span className="font-normal text-gray-500">(optional)</span>}
        </label>
        <Textarea id="cancel-note" className={cn("mt-2", errors.note && "border-red-500")} value={note} onChange={(event) => setNote(event.target.value)} />
        <FieldError>{errors.note}</FieldError>
      </div>
      <Hint icon={Archive}>
        The report is <b>not deleted</b>. It&apos;s kept for audit, removed from the queue and evaluation metrics, and can be restored. Technician {report.technician.name} will be notified.
      </Hint>
    </Shell>
  );
}

function CaseDialog({ report, caseId, onClose }: { report: QueueReport; caseId: string; onClose: () => void }) {
  const detail = useBreakdownReport(report.id, report);
  const similar = detail.data?.triage?.similarCases.find((item) => item.id === caseId);
  if (!similar) return null;
  return (
    <Shell
      title={`${similar.workOrder || "Historical case"} · historical case`}
      description="Read from the work order history (read-only)"
      onClose={onClose}
      footer={<Button variant="outline" onClick={onClose}>Close</Button>}
    >
      <div className="grid grid-cols-3 gap-3 rounded-lg bg-gray-50 p-3">
        <div><div className="text-xs text-gray-500">Similarity</div><div className="mt-1 text-lg font-semibold">{Math.round(similar.similarity * 100)}%</div></div>
        <div><div className="text-xs text-gray-500">Duration</div><div className="mt-1 text-lg font-semibold">{formatHours(similar.hours)}</div></div>
        <div>
          <div className="text-xs text-gray-500">Failure code</div>
          <div className="mt-2">{similar.code ? <code className="rounded bg-white px-1.5 py-0.5 text-xs ring-1 ring-gray-200">{similar.code}</code> : "—"}</div>
        </div>
      </div>
      <div>
        <div className="text-xs text-gray-500">Asset · date · technician</div>
        <div className="mt-1 text-[13.5px]">
          {[
            `${similar.assetName || similar.assetCode || "—"}${similar.assetCode && similar.assetCode !== report.asset.code ? " (same asset type)" : ""}`,
            similar.date && formatDay(similar.date),
            similar.technician,
          ].filter(Boolean).join(" · ")}
        </div>
      </div>
      <div>
        <div className="text-xs text-gray-500">Action</div>
        <div className="mt-1 text-[13.5px]">{similar.action || "—"}</div>
      </div>
      <Hint icon={ScanSearch} tone="primary">
        <b>Why it&apos;s considered similar:</b> {Math.round(similar.similarity * 100)}% match on symptoms and asset
        {similar.assetCode && similar.assetCode !== report.asset.code ? " type" : ""}
        {report.triage?.cause && similar.code && `; probable cause “${report.triage.cause}”`}.
      </Hint>
    </Shell>
  );
}

export function QueueDialogs({ dialog, onClose }: { dialog: QueueDialogState; onClose: () => void }) {
  if (!dialog) return null;
  const { report } = dialog;
  const key = `${dialog.kind}-${report.id}-${dialog.caseId ?? ""}`;
  switch (dialog.kind) {
    case "override":
      return <OverrideDialog key={key} report={report} onClose={onClose} />;
    case "revert":
      return <RevertDialog key={key} report={report} onClose={onClose} />;
    case "assign":
      return <AssignDialog key={key} report={report} onClose={onClose} />;
    case "escalation":
      return <EscalationDialog key={key} report={report} onClose={onClose} />;
    case "reschedule":
      return <RescheduleDialog key={key} report={report} onClose={onClose} />;
    case "cancel":
      return <CancelDialog key={key} report={report} onClose={onClose} />;
    case "case":
      return dialog.caseId ? <CaseDialog key={key} report={report} caseId={dialog.caseId} onClose={onClose} /> : null;
  }
}
