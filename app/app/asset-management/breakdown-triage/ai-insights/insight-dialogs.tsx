"use client";

import { useState } from "react";
import { AlertCircle, BrainCircuit, Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTechnicians } from "../components/use-technicians";
import type { AiInsight } from "../lib/types";
import { DISMISS_REASONS, INSIGHT_PARTS, type DismissReason } from "./insight-data";
import { useAcceptInsight, useDismissInsight } from "./use-ai-insights";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
      <AlertCircle className="h-3.5 w-3.5" />
      {message}
    </p>
  );
}

function Field({ label, required, htmlFor, children }: { label: string; required?: boolean; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-gray-900">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      {children}
    </div>
  );
}

function Notice({ icon: Icon, children }: { icon: typeof Info; children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 rounded-lg border border-gray-200 bg-gray-50 p-3 text-[13px] leading-5 text-gray-700">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
      <div>{children}</div>
    </div>
  );
}

const ACCEPT_NOTICES: Record<AiInsight["kind"], string> = {
  inspect: "The technician gets a task notification in Atlas. Fabrix work orders are not changed.",
  purchase: "A reorder request is sent to the warehouse. Fabrix stock is updated by the next sync once parts arrive.",
  data: "The Fabrix admin gets a notification with the skipped WO and asset code.",
  config: "The insight is marked as accepted and logged for audit.",
};

export function AcceptInsightDialog({ insight, onClose }: { insight: AiInsight | null; onClose: () => void }) {
  return (
    <Dialog open={Boolean(insight)} onOpenChange={(open) => !open && onClose()}>
      {insight && <AcceptInsightForm key={insight.id} insight={insight} onClose={onClose} />}
    </Dialog>
  );
}

const tomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return toDateInput(date);
};
const toDateInput = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

function AcceptInsightForm({ insight, onClose }: { insight: AiInsight; onClose: () => void }) {
  const [technicianId, setTechnicianId] = useState("");
  const [due, setDue] = useState(tomorrow);
  const [qty, setQty] = useState(insight.qty ?? 1);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const part = insight.partId ? INSIGHT_PARTS[insight.partId] : undefined;
  const { kind } = insight;
  const { technicians, isLoading: techniciansLoading } = useTechnicians(kind === "inspect");
  const technician = technicians.find((item) => item.id === technicianId)?.name ?? "";
  const accept = useAcceptInsight(
    kind === "inspect"
      ? `Task sent to ${technician}`
      : kind === "purchase"
        ? "Reorder request sent"
        : kind === "data"
          ? "Fabrix admin notified"
          : "Insight accepted"
  );

  const submit = () => {
    const next: Record<string, string> = {};
    if (kind === "inspect") {
      if (!technicianId) next.technician = "Choose who will do this.";
      if (!due) next.due = "Choose a due date.";
    }
    if (kind === "purchase" && !(qty > 0)) next.qty = "Enter a quantity of at least 1.";
    setErrors(next);
    if (Object.keys(next).length) return;

    accept.mutate(
      {
        id: insight.id,
        note: note.trim() || undefined,
        inspect: kind === "inspect" ? { assignee_id: technicianId, assignee_name: technician, due_date: due } : undefined,
        purchase: kind === "purchase" ? { quantity: qty } : undefined,
      },
      { onSuccess: onClose }
    );
  };

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{kind === "config" ? "Accept insight" : insight.actionLabel}</DialogTitle>
        <DialogDescription>
          {insight.code || insight.id} · {insight.title}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        {kind === "inspect" && (
          <>
            <Field label="Assign to" required>
              <Select value={technicianId} onValueChange={(value) => { setTechnicianId(value); setErrors((current) => ({ ...current, technician: "" })); }}>
                <SelectTrigger className={cn("w-full", errors.technician && "border-red-500")} aria-label="Assign to" disabled={techniciansLoading}>
                  <SelectValue placeholder={techniciansLoading ? "Loading technicians…" : "Choose a technician"} />
                </SelectTrigger>
                <SelectContent>
                  {technicians.length ? (
                    technicians.map((item) => (
                      <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-gray-500">No technicians found</div>
                  )}
                </SelectContent>
              </Select>
              <FieldError message={errors.technician} />
            </Field>
            <Field label="Due date" required htmlFor="insight-due">
              <Input id="insight-due" type="date" min={toDateInput(new Date())} value={due} aria-invalid={Boolean(errors.due)} onChange={(event) => setDue(event.target.value)} />
              <FieldError message={errors.due} />
            </Field>
          </>
        )}
        {kind === "purchase" && (
          <>
            {insight.partId && (
              <div className="flex gap-3 text-sm">
                <span className="w-12 shrink-0 text-gray-500">Part</span>
                <span className="font-medium text-gray-900">
                  {part ? `${part.name} ` : ""}
                  <span className={cn(part && "font-normal text-gray-500")}>
                    {part ? `· ${insight.partId} · stock ${part.qty} · min ${part.min}` : insight.partId}
                  </span>
                </span>
              </div>
            )}
            <Field label={`Quantity (${part?.unit ?? "pcs"})`} required htmlFor="insight-qty">
              <Input id="insight-qty" type="number" min={1} className="font-mono" value={Number.isNaN(qty) ? "" : qty} aria-invalid={Boolean(errors.qty)} onChange={(event) => setQty(event.target.valueAsNumber)} />
              <FieldError message={errors.qty} />
            </Field>
            {part && (
              <Field label="Send to">
                <div className="flex h-9 items-center rounded-md border bg-gray-50 px-3 text-sm text-gray-700">
                  {part.location.split(" · ")[0]} storekeeper
                </div>
              </Field>
            )}
          </>
        )}
        {kind === "data" && (
          <Field label="Send to">
            <div className="flex h-9 items-center rounded-md border bg-gray-50 px-3 text-sm text-gray-700">Fabrix admin (IT)</div>
          </Field>
        )}
        <Field label="Note (optional)" htmlFor="insight-note">
          <Textarea
            id="insight-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={kind === "inspect" ? "e.g. check after today’s repair is done" : "Anything the team should know"}
          />
        </Field>
        <Notice icon={Info}>{ACCEPT_NOTICES[kind]}</Notice>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} disabled={accept.isPending}>
          <Check className="h-4 w-4" />
          {kind === "inspect" ? "Assign" : kind === "purchase" ? "Send request" : kind === "data" ? "Send" : "Accept"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export function DismissInsightDialog({ insight, onClose }: { insight: AiInsight | null; onClose: () => void }) {
  return (
    <Dialog open={Boolean(insight)} onOpenChange={(open) => !open && onClose()}>
      {insight && <DismissInsightForm key={insight.id} insight={insight} onClose={onClose} />}
    </Dialog>
  );
}

function DismissInsightForm({ insight, onClose }: { insight: AiInsight; onClose: () => void }) {
  const dismiss = useDismissInsight();
  const [reason, setReason] = useState<DismissReason | null>(null);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{ reason?: string; note?: string }>({});
  const noteRequired = reason === "Other" || reason === "The data is wrong";

  const submit = () => {
    const next: typeof errors = {};
    if (!reason) next.reason = "Choose a reason.";
    if (noteRequired && !note.trim()) next.note = "Add a short note.";
    setErrors(next);
    if (!reason || Object.keys(next).length) return;
    dismiss.mutate({ id: insight.id, reason, note: note.trim() || undefined }, { onSuccess: onClose });
  };

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Dismiss insight</DialogTitle>
        <DialogDescription>
          {insight.code || insight.id} · {insight.title}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <Field label="Reason" required>
          <div role="radiogroup" aria-label="Reason" className="flex flex-col gap-2">
            {DISMISS_REASONS.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={reason === option}
                onClick={() => { setReason(option); setErrors({}); }}
                className={cn(
                  "flex min-h-11 items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                  reason === option ? "border-primary-400 bg-primary-50 text-primary-800" : "border-gray-200 hover:border-primary-300"
                )}
              >
                <span className={cn("h-4 w-4 rounded-full border-2", reason === option ? "border-primary-600 bg-primary-600 shadow-[inset_0_0_0_2px_#fff]" : "border-gray-300")} />
                {option}
              </button>
            ))}
          </div>
          <FieldError message={errors.reason} />
        </Field>
        <Field label={noteRequired ? "Note" : "Note (optional)"} required={noteRequired} htmlFor="dismiss-note">
          <Textarea id="dismiss-note" value={note} aria-invalid={Boolean(errors.note)} onChange={(event) => setNote(event.target.value)} />
          <FieldError message={errors.note} />
        </Field>
        <Notice icon={BrainCircuit}>
          Your reason is used to improve future insights. Dismissed insights stay for audit and can be reopened.
        </Notice>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Back</Button>
        <Button onClick={submit} disabled={dismiss.isPending}>Dismiss insight</Button>
      </DialogFooter>
    </DialogContent>
  );
}
